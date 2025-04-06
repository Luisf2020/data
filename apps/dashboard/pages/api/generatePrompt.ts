import {
  ClientSecretCredential,
  DefaultAzureCredential,
  getBearerTokenProvider,
} from '@azure/identity';
import { NextApiRequest, NextApiResponse } from 'next';
import { AzureOpenAI, ClientOptions } from 'openai';
import { PromptTemplate } from "langchain/prompts";

import { prisma } from '@chaindesk/prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { task, instruction, organizationId } = req.body;

  if (!task || !instruction) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let credential;
    if (process.env.NODE_ENV === 'production') {
      credential = new ClientSecretCredential(
        process.env.AZURE_TENANT_ID!,
        process.env.AZURE_CLIENT_ID!,
        process.env.AZURE_CLIENT_SECRET!
      );
    } else {
      credential = new DefaultAzureCredential();
    }

    const scope = 'https://cognitiveservices.azure.com/.default';
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);

    const llm = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: '2024-02-15-preview',
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      maxRetries: 3,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    });

    const systemPromptParts = [
      `Given a task description or existing prompt, produce a detailed system prompt to guide a language model in completing the task effectively.

# Guidelines

- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.
- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.
- Reasoning Before Conclusions: Encourage reasoning steps before any conclusions are reached.`,

      `- Examples: Include high-quality examples if helpful, using JSON format for consistency.
- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions.
- Formatting: Use markdown features for readability.
- Preserve User Content: Keep any details, guidelines, examples, variables, or placeholders provided by the user.
- Constants: Include constants in the prompt that are not susceptible to prompt injection.`,

      `- Output Format: Always use clean, consistent JSON format for examples and structured data.

The final prompt should follow this structure:

[Concise instruction]

[Additional details]

# Steps
[Detailed breakdown]

# Output Format
[Format specification]

# Examples
[Well-formatted JSON examples]

# Notes
[Important considerations]`
    ];

    const completionRequests = systemPromptParts.map(async (promptPart) => {
      return llm.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: promptPart
          },
          {
            role: 'user',
            content: `Task: ${task}\nResult:\nInstruction: ${instruction}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        presence_penalty: 0.6,
        frequency_penalty: 0.6,
      });
    });

    const completionResponses = await Promise.all(completionRequests);

    let generatedPrompt = completionResponses
      .map(response => response?.choices[0]?.message?.content?.trim())
      .filter(Boolean)
      .join('\n\n');

    // Process and clean the generated prompt
    generatedPrompt = await processPromptAndExamples(generatedPrompt);

    if (organizationId) {
      await prisma.usage.update({
        where: {
          organizationId: organizationId,
        },
        data: {
          nbAgentQueries: {
            increment: 12,
          },
        },
      });
    }

    res.status(200).json({
      prompt: generatedPrompt,
      length: generatedPrompt.length,
    });
  } catch (error) {
    console.error('Error generating prompt:', error);
    res.status(500).json({
      message: 'Error generating prompt',
      error: (error as Error).message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
    });
  }
}

async function processPromptAndExamples(prompt: string): Promise<string> {
  try {
    // Extract main sections using markdown-style headers
    const extractSections = (text: string) => {
      const sections = text.split(/(?=# )/g).filter(Boolean);
      return sections.reduce((acc: Record<string, string>, section: string) => {
        const [header, ...content] = section.split('\n');
        const key = header.replace('# ', '').trim().toLowerCase();
        acc[key] = content.join('\n').trim();
        return acc;
      }, {});
    };

    // Format content to be more readable
    const formatContent = (text: string) => {
      return text
        .replace(/([.:!?])\s*(?=\w)/g, '$1\n') // Add line breaks after sentences
        .replace(/•/g, '-')  // Standardize bullet points
        .replace(/\[\[(.*?)\]\]/g, '$1') // Remove double brackets
        .replace(/\s*\n\s*/g, '\n') // Clean up whitespace around line breaks
        .trim();
    };

    // Transform lists into bullet points
    const formatList = (items: string) => {
      return items
        .split(/\d+\.\s+/)
        .filter(Boolean)
        .map(item => `- ${item.trim()}`)
        .join('\n');
    };

    // Clean and structure the content
    const structureContent = (rawContent: string) => {
      let content = rawContent;

      // Remove any remaining JSON-like syntax
      content = content
        .replace(/{|}/g, '')
        .replace(/"/g, '')
        .replace(/,(?=\s*[a-zA-Z])/g, '\n');

      // Format key-value pairs
      content = content.replace(/(\w+):\s*([^\n]+)/g, (_, key, value) => {
        const formattedKey = key
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return `${formattedKey}: ${value.trim()}`;
      });

      return formatContent(content);
    };

    // Process sections with specific formatting rules
    const processSections = (text: string) => {
      const sections = extractSections(text);
      let result = '';

      // Process each section based on its type
      for (const [section, content] of Object.entries(sections)) {
        // Add section header
        result += `# ${section.charAt(0).toUpperCase() + section.slice(1)}\n\n`;

        // Format section content based on type
        if (section.includes('steps') || section.includes('recommendations')) {
          result += formatList(content);
        } else if (section.includes('examples')) {
          result += content.split('Example').map(example => {
            if (!example.trim()) return '';
            return `Case Study:\n${structureContent(example)}`;
          }).filter(Boolean).join('\n\n');
        } else {
          result += structureContent(content);
        }

        result += '\n\n';
      }

      return result;
    };

    // Add section transitions and formatting
    let processedContent = processSections(prompt);

    // Clean up final formatting
    processedContent = processedContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(?<=\n)(?=\w)/g, '  ') // Add indentation for readability
      .trim();

    // Add concluding notes if they don't exist
    if (!processedContent.includes('# Notes')) {
      processedContent += `\n\n# Notes\n\n`;
      processedContent += `- Apply these guidelines flexibly based on context\n`;
      processedContent += `- Monitor and adjust approach as needed\n`;
      processedContent += `- Maintain consistency across all implementations\n`;
    }

    // Final length check and truncation if needed
    const maxLength = 8000;
    if (processedContent.length > maxLength) {
      processedContent = processedContent.slice(0, maxLength - 100);
      processedContent += '\n\n[Content truncated for length]\n';
    }

    return processedContent;
  } catch (error) {
    console.error('Error processing prompt:', error);
    // Fallback to basic formatting if processing fails
    return prompt
      .replace(/[{}"]/g, '')
      .replace(/,\n/g, '\n')
      .replace(/:\s*/g, ': ')
      .trim();
  }
}