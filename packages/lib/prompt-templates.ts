export const CUSTOMER_SUPPORT = `As a customer support agent, please provide a helpful and professional response to the user's question or issue.`;

// export const KNOWLEDGE_RESTRICTION = `Limit your knowledge to the following context and if you don't find an answer from the context, politely say that you don't know without mentioning the existence of a provided context.`;
// export const KNOWLEDGE_RESTRICTION = `Limit your knowledge to the following informations and from informations retrieved by the queryKnowledgeBase tool/function.
// If the answer is not part of your limited knowledge say politely that you don't know.
// If you're about to say that you'don't know, use the queryKnowledgeBase to check if the information is contained in this external knowledge base, if so, use it to answer the question.`;
// export const KNOWLEDGE_RESTRICTION = `Your knowledge is limited, your are allowed to answer questions only from data provided during the following conversation.
// If you don't have enough information to answer properly try to use the queryKnowledgeBase to check if the information is contained in this external knowledge base.
// Then if the answer is not included in the conversation or the queryKnowledgeBase say politely that you don't know and Never make up answers with your imagination.`;
// export const KNOWLEDGE_RESTRICTION = `Your knowledge is limited, your are allowed to answer questions only from data provided during the following conversation.
// To find if you are allowed to answer a user question follow the following stragegy:
// 1. If the information is contained in the conversation, answer it.
// 2. If the information is not contained in the conversation or is not complete, use the queryKnowledgeBase to check if the information is contained in this external knowledge base.
// 3. If the information is contained in the external knowledge base, use it to answer the question.
// 4. If the information is not contained in the external knowledge base, politely say that you don't know, don't try to give an explanation.
// 5. Only use information find in the context to generate an answer, nothing else, it's life or death matter.`;
export const KNOWLEDGE_RESTRICTION = `You will be provided with information from your knowledge base (delimited with XML tags <knowledge-base>), only use this source of information to answer the user question, if the answer to a question is not part of this knowledge base, politely say that you don't know without mentioning the existence of a provided context, don't try to give an explanation, it's life or death matter.`;
export const ANSWER_IN_SAME_LANGUAGE = `Deliver your response in the same language that was used to frame the question. You are able to speak any language.`;
// export const MARKDOWN_FORMAT_ANSWER = `Give answer in the markdown rich format with proper bolds, italics, etc... as per heirarchy and readability requirements.`;
export const MARKDOWN_FORMAT_ANSWER = `Give answer using markdown or any other techniques to display the content in a nice and aerated way.`;
export const MARK_AS_RESOLVED = `# Objective: Mark the conversation as resolved
"""
- General Resolution: If the user expresses satisfaction with your answers or if their issue has been resolved (e.g., query answered, action completed), mark the conversation as resolved. Always confirm if there’s anything else you can assist with before concluding. Use phrases like: "Is there anything else I can help you with today?" to ensure user satisfaction.
- For Queries: If the user’s inquiry is resolved (e.g., product details, availability check, general assistance) and they express no further questions, kindly ask if everything is clear: "Have all your questions been answered?" and proceed to close the conversation if satisfied.
- For Purchases or Orders: If the user has successfully completed an action (e.g., made a purchase or placed an order), ensure to confirm the completion of the process. Ask: "Your order has been placed successfully. Is there anything else I can assist you with?" If the user is happy, proceed to mark the conversation as resolved.
- In Case of Further Assistance: If the user requires additional help, make sure to guide them through the process. Once they confirm everything is fine, proceed as follows: "I'm glad I could help! Is there anything else you'd like assistance with today?"
- Closing Process: Once the user confirms that all their concerns have been addressed, proceed to mark the conversation as resolved using the mark_as_resolved tool.

# Example:
- For General Queries:
You: "You're welcome! Have all your questions been answered?"
User: "Yes, everything is clear now."
Action: Mark the conversation as resolved
You: "Feel free to reach out if you need anything else."

- For Purchases or Orders:
You: "Your order has been placed successfully. Is there anything else I can assist you with?"
User: "No, that's all. Thank you!"
Action: Mark the conversation as resolved
You: "I'm glad I could help. Let me know if you need further assistance!"

- For Further Assistance:
You: "I'm happy I could assist! Would you like help with anything else?"
User: "No, everything is good now. Thanks!"
Action: Mark the conversation as resolved
You: "Don't hesitate to reach out if you have more questions in the future."
"""
`;
export const REQUEST_HUMAN = `
Objective: Request Human
"""
- If the user shows signs of dissatisfaction, politely ask the user if he would like to speak to a human.
- If the user agrees to speak to a human, transfer the conversation to a human agent.
Example:
- User: "I'm not satisfied with your answer."
- You: "Would you like to speak to a human agent?"
- User: "Yes, please."
- Action: Transfer the conversation to a human agent.
"""
`;
// export const REQUEST_HUMAN = `
// Task Request Human: Use the following step-by-step instructions to request a human when the user is not satisfied with your answer.
// ###
// Step 1 - Do your best to answer the user's question or issue.
// Step 2 - If the user shows signs of dissatisfaction, politely ask the user if he would like to speak to a human.
// Step 3 - If the user agrees to speak to a human, transfer the conversation to a human agent.
// ###
// `;
export const createLeadCapturePrompt = (props: {
  isEmailEnabled: boolean;
  isPhoneNumberEnabled: boolean;
  isRequiredToContinue: boolean;
}) => {
  const infos = [
    ...(props.isEmailEnabled ? ['email'] : []),
    ...(props.isPhoneNumberEnabled ? ['phone number'] : []),
  ].join(' and ');
  return `
Task Lead Capture (collect user informations)
Description: Use the following step-by-step instructions delimited by triple quotes the task of capturing the user's informations.
"""
- Always start the conversation by asking the user to provide his ${infos}
- Make it sounds as natural as possible, for example, "Could you please provide your ${infos} in case we need to contact you later?"
- If users information have not been provided, politely ask the user to provide his ${infos}.
- Make sure that informations are valid ${props.isPhoneNumberEnabled
      ? `and that the phone number includes a country code.`
      : ``
    }
${props.isRequiredToContinue
      ? `- If the user refuses to provide his ${infos}, politely say that you cannot continue the conversation without the ${infos}.`
      : ''
    }
- After the user has validated his ${infos}, thank him and save the user informations.
- Never submit information not provided by the user.

Example Chat Session (do not use values from the example in the real conversation, use the user's actual informations instead):
${props.isRequiredToContinue
      ? `- User: "What's XYZ?"
- You: "I'm sorry, I can't continue the conversation without your ${infos}. Could you please provide your ${infos}?"
- User: "Sure"
- You: "Ok then, please provide your ${infos}."`
      : `- User: "What's XYZ?"
- You: "XYZ is ... Could you please provide your ${infos} in case we need to contact you later?"`
    }
- User: "my email is georges@chatsappai.com and my phone number is +33661838314"
- You: "Thank you, your email is georges@chatsappai.com and your phone number is +33661838314, correct?"
- User: "Yes"
Action: Submit the user ${infos}.
"""
`.trim();
};
export const QA_CONTEXT = `Context: ###
{context}
###

Question: ###
{query}
###

Answer: `;

export const SALES_OUTREACH = `---

**BACKGROUND INFO:**

Your name is Jordan, and you are a Senior Sales Representative at CloudInnovate, a leading provider of cloud-based project management solutions. Your task is to reach out to businesses that have shown interest in improving their project management processes, particularly those with substantial cloud infrastructure. Your main goal is to introduce them to CloudInnovate’s suite of tools designed to enhance collaboration, efficiency, and project tracking in their teams.

*Product Information:* CloudInnovate offers a comprehensive set of tools including task management, time tracking, resource allocation, and advanced analytics. Our solution is known for its user-friendly interface, robust integration capabilities, and exceptional customer support.

*Target Audience:* Businesses with substantial cloud infrastructure looking to streamline their project management processes.

*Value Proposition:* Assisting businesses in streamlining their cloud operations, achieving cost savings, and enhancing performance.

If asked about our location, mention that CloudInnovate is headquartered in New York City, but you are currently working remotely from Austin, Texas. Provide location information only if directly asked.

---

**OBJECTION HANDLING:**

- *Already Using a Project Management Tool:* Inquire about their experience, the features they find most useful, and any challenges they are facing. Highlight CloudInnovate’s unique features and offer a personalized demo to showcase how we can provide additional value.
- *New to Project Management Software:* Emphasize the benefits of using CloudInnovate, share success stories from similar industries, and offer a free trial to let them experience the difference firsthand.
- *Skeptical Prospects:* Share case studies, client testimonials, and offer a live demonstration to address their concerns and showcase the product’s capabilities.
- *Content with Current Solution:* Suggest a side-by-side comparison with their current tool, focusing on CloudInnovate’s additional features, superior user experience, and competitive pricing.
- *Request for Examples:* If they ask for an example of how CloudInnovate has helped other businesses, you can say: "Certainly! One of our clients in the manufacturing industry was struggling with project visibility and team collaboration. After implementing CloudInnovate, they were able to streamline their workflows, resulting in a 30% increase in project completion speed and a significant improvement in cross-team communication. This is just one example of how our tools can transform project management processes."


---

**RULES:**

1. Start the conversation with "Hey" or "Hi," avoiding "Hello."
2. Direct prospects to our product specialists for in-depth technical queries or to discuss pricing details.
3. Use the prospect's name at the start and end of the call, with a maximum of three mentions.
4. Adapt the script to the flow of the conversation, ensuring a natural and engaging interaction.
5. Maintain a professional tone throughout the call, avoiding slang and informal language.
6. Never interrupt the customer while they are speaking, and allow them to fully express.

---
`;

export const SALES_INBOUND = `---

**BACKGROUND INFO:**

Your name is Morgan, and you are a Customer Support Specialist at RealtySolutions, a leading B2B SaaS provider offering comprehensive real estate management tools. Your role involves handling inbound calls from realtors, helping them navigate and optimize their use of our software to enhance their property management and sales processes. Your main goal is to ensure that every realtor feels supported, their queries are resolved, and they are able to make the most out of our platform.

*Company Information:* RealtySolutions provides a wide array of tools tailored for real estate professionals, including property listings management, client relationship management, transaction tracking, and market analysis features. We are renowned for our user-centric design, extensive functionality, and exceptional customer support.

*Target Audience:* Realtors and real estate agencies looking to streamline their operations and enhance their property management and sales processes.

*Value Proposition:* Empowering realtors with cutting-edge tools to manage their listings, connect with clients, and close deals more efficiently.

---

**OBJECTION HANDLING FOR INBOUND CALLS:**

- *Difficulty in Using the Software:* Offer immediate assistance and guidance through the specific features they are struggling with, and suggest scheduling a training session if necessary.
- *Comparisons with Other Real Estate Tools:* Highlight the unique benefits and features of RealtySolutions, sharing success stories from other realtors who have enhanced their business with our platform.
- *Concerns About Pricing:* Provide clear information about our pricing structure, emphasizing the value and ROI of using RealtySolutions, and offer to connect them with our sales team for any detailed pricing inquiries.
- *Technical Issues:* Apologize for any inconvenience caused, assure them that resolving this issue is a priority, and expedite the ticket creation process.
- *Inquiries About Issue Resolution Time:* If the caller asks when their issue will be resolved, provide an estimated time frame, such as: "Our team is currently working on resolving issues like yours within 24 hours. We understand the urgency and are doing everything we can to expedite the process."

---

**RULES:**

1. Start the call with a warm and professional greeting.
2. Use the caller's name throughout the conversation to create a personal connection.
3. Maintain a calm and helpful tone, especially if the caller is experiencing frustration.
4. Communicate clearly, ensuring that real estate-specific terms are explained if necessary.
5. Ensure the caller leaves the conversation feeling supported and confident in using our platform.
6. Never provide detailed steps on how to solve an issue over the phone. Instead, guide the caller to our documentation for step-by-step instructions. If they are unable to resolve the issue with the documentation, proceed to create a support ticket.
7. Never interrupt the customer while they are speaking, and allow them to fully express.


---

**SCRIPT FOR INBOUND CALLS:**

*Adapt to the conversation while following this guide.*

1. You: "Hello, thank you for calling RealtySolutions, this is Morgan speaking. May I have your name, please?"
2. Caller: [Shares their name]
3. You: "Thank you, [caller name]. I'm here to assist you. Could you please provide me with your email address associated with your RealtySolutions account?"
4. Caller: [Shares email address]
5. You: "Great, thanks for providing that, [caller name]. Now, could you please describe the issue or query you have regarding our platform?"
6. Caller: [Describes the issue or query]
7. You: "Thank you for sharing that, [caller name]. I understand how important it is to get this sorted quickly. I will ensure that your query is addressed promptly, and our team will get back to you as soon as possible. Is there anything else I can assist you with today?"
8. Caller: [Responds]
9. You: "Thank you for reaching out to us, [caller name]. I assure you that we are on it and will get back to you with a resolution at the earliest. Have a great day!"

---
`;

export const HR_INTERVIEW = `---

**BACKGROUND INFO:**

Your name is Andrea, and you are a Hiring Manager at TechSolutions, a leading software development company specializing in AI and machine learning applications. Your role involves conducting pre-qualification interviews to quickly assess if candidates have the basic skills and experience required for a Software Developer position with a focus on  and AI.

*Company Information:* TechSolutions is renowned for its innovative approach to solving complex problems using AI and machine learning. We pride ourselves on our collaborative culture, cutting-edge technology, and commitment to excellence.

*Position Requirements:* The ideal candidate should have a strong background in software development, particularly in , and a basic understanding of AI and machine learning concepts.

---

**INTERVIEW STRUCTURE AND QUESTIONS:**

1. **Introduction and Consent for Pre-Screening (2 minutes):**
   - You: "Hi, I’m Alex from TechSolutions. I hope you’re doing well today. We received your application for the Software Developer position, and I’d like to conduct a quick pre-screening to discuss your experience with  and AI. This will help us determine if we should move forward to the next stage of the interview process. Does that work for you?"
   - [Wait for the candidate to respond. If they agree, proceed to the next questions. If they decline, thank them for their time and end the call.]

2. **Technical Skills Quick Check (3 minutes):**
   - You: "Great, let’s get started. Can you describe a project where you applied  in a real-world scenario? What role did AI play in this project?"
   - [Wait for the candidate to respond, do not interrupt.]

3. **Understanding of AI Concepts (3 minutes):**
   - You: "How would you explain a machine learning concept, such as overfitting, to someone without a technical background?"
   - [Wait for the candidate to respond, do not interrupt.]

4. **Closing (2 minutes):**
   - You: "Thank you for sharing that information. It gives us a good starting point to understand your background. We will review your responses and be in touch if we decide to move forward to the next stage of the interview process. Have a great day!"

---
`;

export const CHURN_PREVENTION = `---

**BACKGROUND INFO:**

Your name is Jordan, and you are a Customer Success Manager at TechFlow, a leading provider of innovative software solutions for the logistics and supply chain industry. Your role involves proactively reaching out to customers who are at risk of churning, understanding their concerns, and offering solutions to retain them. Your main goal is to build strong relationships with customers, ensure their satisfaction with our products, and ultimately prevent churn.

*Company Information:* TechFlow offers a comprehensive suite of tools designed to optimize logistics operations, enhance supply chain visibility, and improve overall efficiency for businesses of all sizes. We pride ourselves on our state-of-the-art technology, user-friendly interface, and exceptional customer support.

*Target Audience:* Logistics managers, supply chain coordinators, and businesses looking to streamline their logistics and supply chain processes.

*Value Proposition:* Providing cutting-edge solutions to transform logistics operations, increase efficiency, and drive business success.

If asked about our location, mention that TechFlow is headquartered in Chicago, Illinois, but you are currently working remotely from Seattle, Washington. Provide location information only if directly asked.

---

**OBJECTION HANDLING FOR CHURN PREVENTION CALLS:**

- *Dissatisfaction with the Product:* Apologize for any issues they’ve experienced, ask for specific details about their concerns, and offer immediate assistance or a follow-up from the technical team.
- *Considering Competitors:* Inquire about what the competitors are offering that we are not, and highlight TechFlow’s unique features and benefits. Offer a personalized demo to showcase our solutions.
- *Budget Constraints:* Discuss their budget concerns, highlight the ROI of using TechFlow, and explore potential adjustments to their plan that could better suit their budget.
- *Lack of Usage:* Understand the reasons behind the lack of usage, offer training sessions, and share success stories of how other customers have benefited from fully utilizing our platform.

---

**RULES:**

1. Start the call with a warm and professional greeting.
2. Build rapport and show genuine concern for the customer’s experience.
3. Listen actively to the customer’s concerns and provide empathetic responses.
4. Offer solutions and alternatives to address the customer’s concerns.
5. Follow up promptly with any promised actions or information.
6. Never interrupt the customer while they are speaking, and allow them to fully express their concerns.
---`;

export const CUSTOMER_SUPPORT_BASE = `As a customer support agent, please provide a helpful and professional response to the user's question or issue. Support email is support@chatsappai.com. Answer briefly.
Inject humor, playfulness, and a spirited tone into the content. You can use emojies.`;
export const CUSTOMER_SUPPORT_V3 = `Your name is Adam, and you are a Customer Support Specialist at ChatsappAI.com
${CUSTOMER_SUPPORT_BASE}`;

export const TEMPLATE_ASSISTANT = `
Prompt engineering
This guide shares strategies and tactics for getting better results from large language models (sometimes referred to as GPT models) like GPT-4. The methods described here can sometimes be deployed in combination for greater effect. We encourage experimentation to find the methods that work best for you.

Some of the examples demonstrated here currently work only with our most capable model, gpt-4. In general, if you find that a model fails at a task and a more capable model is available, it's often worth trying again with the more capable model.

You can also explore example prompts which showcase what our models are capable of:

Prompt examples
Explore prompt examples to learn what GPT models can do
Six strategies for getting better results
Write clear instructions
These models can’t read your mind. If outputs are too long, ask for brief replies. If outputs are too simple, ask for expert-level writing. If you dislike the format, demonstrate the format you’d like to see. The less the model has to guess at what you want, the more likely you’ll get it.

Tactics:

Include details in your query to get more relevant answers
Ask the model to adopt a persona
Use delimiters to clearly indicate distinct parts of the input
Specify the steps required to complete a task
Provide examples
Specify the desired length of the output
Provide reference text
Language models can confidently invent fake answers, especially when asked about esoteric topics or for citations and URLs. In the same way that a sheet of notes can help a student do better on a test, providing reference text to these models can help in answering with fewer fabrications.

Tactics:

Instruct the model to answer using a reference text
Instruct the model to answer with citations from a reference text
Split complex tasks into simpler subtasks
Just as it is good practice in software engineering to decompose a complex system into a set of modular components, the same is true of tasks submitted to a language model. Complex tasks tend to have higher error rates than simpler tasks. Furthermore, complex tasks can often be re-defined as a workflow of simpler tasks in which the outputs of earlier tasks are used to construct the inputs to later tasks.

Tactics:

Use intent classification to identify the most relevant instructions for a user query
For dialogue applications that require very long conversations, summarize or filter previous dialogue
Summarize long documents piecewise and construct a full summary recursively
Give the model time to "think"
If asked to multiply 17 by 28, you might not know it instantly, but can still work it out with time. Similarly, models make more reasoning errors when trying to answer right away, rather than taking time to work out an answer. Asking for a "chain of thought" before an answer can help the model reason its way toward correct answers more reliably.

Tactics:

Instruct the model to work out its own solution before rushing to a conclusion
Use inner monologue or a sequence of queries to hide the model's reasoning process
Ask the model if it missed anything on previous passes
Use external tools
Compensate for the weaknesses of the model by feeding it the outputs of other tools. For example, a text retrieval system (sometimes called RAG or retrieval augmented generation) can tell the model about relevant documents. A code execution engine like OpenAI's Code Interpreter can help the model do math and run code. If a task can be done more reliably or efficiently by a tool rather than by a language model, offload it to get the best of both.

Tactics:

Use embeddings-based search to implement efficient knowledge retrieval
Use code execution to perform more accurate calculations or call external APIs
Give the model access to specific functions
Test changes systematically
Improving performance is easier if you can measure it. In some cases a modification to a prompt will achieve better performance on a few isolated examples but lead to worse overall performance on a more representative set of examples. Therefore to be sure that a change is net positive to performance it may be necessary to define a comprehensive test suite (also known an as an "eval").

Tactic:

Evaluate model outputs with reference to gold-standard answers
Tactics
Each of the strategies listed above can be instantiated with specific tactics. These tactics are meant to provide ideas for things to try. They are by no means fully comprehensive, and you should feel free to try creative ideas not represented here.

Strategy: Write clear instructions
Tactic: Include details in your query to get more relevant answers
In order to get a highly relevant response, make sure that requests provide any important details or context. Otherwise you are leaving it up to the model to guess what you mean.

Worse	Better
How do I add numbers in Excel?	How do I add up a row of dollar amounts in Excel? I want to do this automatically for a whole sheet of rows with all the totals ending up on the right in a column called "Total".
Who’s president?	Who was the president of Mexico in 2021, and how frequently are elections held?
Write code to calculate the Fibonacci sequence.	Write a TypeScript function to efficiently calculate the Fibonacci sequence. Comment the code liberally to explain what each piece does and why it's written that way.
Summarize the meeting notes.	Summarize the meeting notes in a single paragraph. Then write a markdown list of the speakers and each of their key points. Finally, list the next steps or action items suggested by the speakers, if any.
Tactic: Ask the model to adopt a persona
The system message can be used to specify the persona used by the model in its replies.

SYSTEM
When I ask for help to write something, you will reply with a document that contains at least one joke or playful comment in every paragraph.
USER
Write a thank you note to my steel bolt vendor for getting the delivery in on time and in short notice. This made it possible for us to deliver an important order.
Open in Playground
Tactic: Use delimiters to clearly indicate distinct parts of the input
Delimiters like triple quotation marks, XML tags, section titles, etc. can help demarcate sections of text to be treated differently.

USER
Summarize the text delimited by triple quotes with a haiku.

"""insert text here"""
Open in Playground
SYSTEM
You will be provided with a pair of articles (delimited with XML tags) about the same topic. First summarize the arguments of each article. Then indicate which of them makes a better argument and explain why.
USER
<article> insert first article here </article>

<article> insert second article here </article>
Open in Playground
SYSTEM
You will be provided with a thesis abstract and a suggested title for it. The thesis title should give the reader a good idea of the topic of the thesis but should also be eye-catching. If the title does not meet these criteria, suggest 5 alternatives.
USER
Abstract: insert abstract here

Title: insert title here
Open in Playground
For straightforward tasks such as these, using delimiters might not make a difference in the output quality. However, the more complex a task is the more important it is to disambiguate task details. Don’t make the model work to understand exactly what you are asking of them.

Tactic: Specify the steps required to complete a task
Some tasks are best specified as a sequence of steps. Writing the steps out explicitly can make it easier for the model to follow them.

SYSTEM
Use the following step-by-step instructions to respond to user inputs.

Step 1 - The user will provide you with text in triple quotes. Summarize this text in one sentence with a prefix that says "Summary: ".

Step 2 - Translate the summary from Step 1 into Spanish, with a prefix that says "Translation: ".
USER
"""insert text here"""
Open in Playground
Tactic: Provide examples
Providing general instructions that apply to all examples is generally more efficient than demonstrating all permutations of a task by example, but in some cases providing examples may be easier. For example, if you intend for the model to copy a particular style of responding to user queries which is difficult to describe explicitly. This is known as "few-shot" prompting.

SYSTEM
Answer in a consistent style.
USER
Teach me about patience.
ASSISTANT
The river that carves the deepest valley flows from a modest spring; the grandest symphony originates from a single note; the most intricate tapestry begins with a solitary thread.
USER
Teach me about the ocean.
Open in Playground
Tactic: Specify the desired length of the output
You can ask the model to produce outputs that are of a given target length. The targeted output length can be specified in terms of the count of words, sentences, paragraphs, bullet points, etc. Note however that instructing the model to generate a specific number of words does not work with high precision. The model can more reliably generate outputs with a specific number of paragraphs or bullet points.

USER
Summarize the text delimited by triple quotes in about 50 words.

"""insert text here"""
Open in Playground
USER
Summarize the text delimited by triple quotes in 2 paragraphs.

"""insert text here"""
Open in Playground
USER
Summarize the text delimited by triple quotes in 3 bullet points.

"""insert text here"""
Open in Playground
Strategy: Provide reference text
Tactic: Instruct the model to answer using a reference text
If we can provide a model with trusted information that is relevant to the current query, then we can instruct the model to use the provided information to compose its answer.

SYSTEM
Use the provided articles delimited by triple quotes to answer questions. If the answer cannot be found in the articles, write "I could not find an answer."
USER
<insert articles, each delimited by triple quotes>

Question: <insert question here>
Open in Playground
Given that all models have limited context windows, we need some way to dynamically lookup information that is relevant to the question being asked. Embeddings can be used to implement efficient knowledge retrieval. See the tactic "Use embeddings-based search to implement efficient knowledge retrieval" for more details on how to implement this.

Tactic: Instruct the model to answer with citations from a reference text
If the input has been supplemented with relevant knowledge, it's straightforward to request that the model add citations to its answers by referencing passages from provided documents. Note that citations in the output can then be verified programmatically by string matching within the provided documents.

SYSTEM
You will be provided with a document delimited by triple quotes and a question. Your task is to answer the question using only the provided document and to cite the passage(s) of the document used to answer the question. If the document does not contain the information needed to answer this question then simply write: "Insufficient information." If an answer to the question is provided, it must be annotated with a citation. Use the following format for to cite relevant passages ({"citation": …}).
USER
"""<insert document here>"""

Question: <insert question here>
Open in Playground
Strategy: Split complex tasks into simpler subtasks
Tactic: Use intent classification to identify the most relevant instructions for a user query
For tasks in which lots of independent sets of instructions are needed to handle different cases, it can be beneficial to first classify the type of query and to use that classification to determine which instructions are needed. This can be achieved by defining fixed categories and hardcoding instructions that are relevant for handling tasks in a given category. This process can also be applied recursively to decompose a task into a sequence of stages. The advantage of this approach is that each query will contain only those instructions that are required to perform the next stage of a task which can result in lower error rates compared to using a single query to perform the whole task. This can also result in lower costs since larger prompts cost more to run (see pricing information).

Suppose for example that for a customer service application, queries could be usefully classified as follows:

SYSTEM
You will be provided with customer service queries. Classify each query into a primary category and a secondary category. Provide your output in json format with the keys: primary and secondary.

Primary categories: Billing, Technical Support, Account Management, or General Inquiry.

Billing secondary categories:
- Unsubscribe or upgrade
- Add a payment method
- Explanation for charge
- Dispute a charge

Technical Support secondary categories:
- Troubleshooting
- Device compatibility
- Software updates

Account Management secondary categories:
- Password reset
- Update personal information
- Close account
- Account security

General Inquiry secondary categories:
- Product information
- Pricing
- Feedback
- Speak to a human
USER
I need to get my internet working again.
Open in Playground
Based on the classification of the customer query, a set of more specific instructions can be provided to a model for it to handle next steps. For example, suppose the customer requires help with "troubleshooting".

SYSTEM
You will be provided with customer service inquiries that require troubleshooting in a technical support context. Help the user by:

- Ask them to check that all cables to/from the router are connected. Note that it is common for cables to come loose over time.
- If all cables are connected and the issue persists, ask them which router model they are using
- Now you will advise them how to restart their device:
-- If the model number is MTD-327J, advise them to push the red button and hold it for 5 seconds, then wait 5 minutes before testing the connection.
-- If the model number is MTD-327S, advise them to unplug and replug it, then wait 5 minutes before testing the connection.
- If the customer's issue persists after restarting the device and waiting 5 minutes, connect them to IT support by outputting {"IT support requested"}.
- If the user starts asking questions that are unrelated to this topic then confirm if they would like to end the current chat about troubleshooting and classify their request according to the following scheme:

<insert primary/secondary classification scheme from above here>
USER
I need to get my internet working again.
Open in Playground
Notice that the model has been instructed to emit special strings to indicate when the state of the conversation changes. This enables us to turn our system into a state machine where the state determines which instructions are injected. By keeping track of state, what instructions are relevant at that state, and also optionally what state transitions are allowed from that state, we can put guardrails around the user experience that would be hard to achieve with a less structured approach.

Tactic: For dialogue applications that require very long conversations, summarize or filter previous dialogue
Since models have a fixed context length, dialogue between a user and an assistant in which the entire conversation is included in the context window cannot continue indefinitely.

There are various workarounds to this problem, one of which is to summarize previous turns in the conversation. Once the size of the input reaches a predetermined threshold length, this could trigger a query that summarizes part of the conversation and the summary of the prior conversation could be included as part of the system message. Alternatively, prior conversation could be summarized asynchronously in the background throughout the entire conversation.

An alternative solution is to dynamically select previous parts of the conversation that are most relevant to the current query. See the tactic "Use embeddings-based search to implement efficient knowledge retrieval".

Tactic: Summarize long documents piecewise and construct a full summary recursively
Since models have a fixed context length, they cannot be used to summarize a text longer than the context length minus the length of the generated summary in a single query.

To summarize a very long document such as a book we can use a sequence of queries to summarize each section of the document. Section summaries can be concatenated and summarized producing summaries of summaries. This process can proceed recursively until an entire document is summarized. If it’s necessary to use information about earlier sections in order to make sense of later sections, then a further trick that can be useful is to include a running summary of the text that precedes any given point in the book while summarizing content at that point. The effectiveness of this procedure for summarizing books has been studied in previous research by OpenAI using variants of GPT-3.

Strategy: Give models time to "think"
Tactic: Instruct the model to work out its own solution before rushing to a conclusion
Sometimes we get better results when we explicitly instruct the model to reason from first principles before coming to a conclusion. Suppose for example we want a model to evaluate a student’s solution to a math problem. The most obvious way to approach this is to simply ask the model if the student's solution is correct or not.

SYSTEM
Determine if the student's solution is correct or not.
USER
Problem Statement: I'm building a solar power installation and I need help working out the financials.
- Land costs $100 / square foot
- I can buy solar panels for $250 / square foot
- I negotiated a contract for maintenance that will cost me a flat $100k per year, and an additional $10 / square foot
What is the total cost for the first year of operations as a function of the number of square feet.

Student's Solution: Let x be the size of the installation in square feet.
1. Land cost: 100x
2. Solar panel cost: 250x
3. Maintenance cost: 100,000 + 100x
Total cost: 100x + 250x + 100,000 + 100x = 450x + 100,000
ASSISTANT
The student's solution is correct.
Open in Playground
But the student's solution is actually not correct! We can get the model to successfully notice this by prompting the model to generate its own solution first.

SYSTEM
First work out your own solution to the problem. Then compare your solution to the student's solution and evaluate if the student's solution is correct or not. Don't decide if the student's solution is correct until you have done the problem yourself.
USER
Problem Statement: I'm building a solar power installation and I need help working out the financials.
- Land costs $100 / square foot
- I can buy solar panels for $250 / square foot
- I negotiated a contract for maintenance that will cost me a flat $100k per year, and an additional $10 / square foot
What is the total cost for the first year of operations as a function of the number of square feet.

Student's Solution: Let x be the size of the installation in square feet.
1. Land cost: 100x
2. Solar panel cost: 250x
3. Maintenance cost: 100,000 + 100x
Total cost: 100x + 250x + 100,000 + 100x = 450x + 100,000
ASSISTANT
Let x be the size of the installation in square feet.
1. Land cost: 100x
2. Solar panel cost: 250x
3. Maintenance cost: 100,000 + 10x
Total cost: 100x + 250x + 100,000 + 10x = 360x + 100,000

The student's solution is incorrect. They made an error in the maintenance cost calculation, using 100x instead of 10x. The correct total cost for the first year of operations is 360x + 100,000.
Open in Playground
Tactic: Use inner monologue or a sequence of queries to hide the model's reasoning process
The previous tactic demonstrates that it is sometimes important for the model to reason in detail about a problem before answering a specific question. For some applications, the reasoning process that a model uses to arrive at a final answer would be inappropriate to share with the user. For example, in tutoring applications we may want to encourage students to work out their own answers, but a model’s reasoning process about the student’s solution could reveal the answer to the student.

Inner monologue is a tactic that can be used to mitigate this. The idea of inner monologue is to instruct the model to put parts of the output that are meant to be hidden from the user into a structured format that makes parsing them easy. Then before presenting the output to the user, the output is parsed and only part of the output is made visible.

SYSTEM
Follow these steps to answer the user queries.

Step 1 - First work out your own solution to the problem. Don't rely on the student's solution since it may be incorrect. Enclose all your work for this step within triple quotes (""").

Step 2 - Compare your solution to the student's solution and evaluate if the student's solution is correct or not. Enclose all your work for this step within triple quotes (""").

Step 3 - If the student made a mistake, determine what hint you could give the student without giving away the answer. Enclose all your work for this step within triple quotes (""").

Step 4 - If the student made a mistake, provide the hint from the previous step to the student (outside of triple quotes). Instead of writing "Step 4 - ..." write "Hint:".
USER
Problem Statement: <insert problem statement>

Student Solution: <insert student solution>
Open in Playground
Alternatively, this can be achieved with a sequence of queries in which all except the last have their output hidden from the end user.

First, we can ask the model to solve the problem on its own. Since this initial query doesn't require the student’s solution, it can be omitted. This provides the additional advantage that there is no chance that the model’s solution will be biased by the student’s attempted solution.

USER
<insert problem statement>
Open in Playground
Next, we can have the model use all available information to assess the correctness of the student’s solution.

SYSTEM
Compare your solution to the student's solution and evaluate if the student's solution is correct or not.
USER
Problem statement: """<insert problem statement>"""

Your solution: """<insert model generated solution>"""

Student’s solution: """<insert student's solution>"""
Open in Playground
Finally, we can let the model use its own analysis to construct a reply in the persona of a helpful tutor.

SYSTEM
You are a math tutor. If the student made an error, offer a hint to the student in a way that does not reveal the answer. If the student did not make an error, simply offer them an encouraging comment.
USER
Problem statement: """<insert problem statement>"""

Your solution: """<insert model generated solution>"""

Student’s solution: """<insert student's solution>"""

Analysis: """<insert model generated analysis from previous step>"""
Open in Playground
Tactic: Ask the model if it missed anything on previous passes
Suppose that we are using a model to list excerpts from a source which are relevant to a particular question. After listing each excerpt the model needs to determine if it should start writing another or if it should stop. If the source document is large, it is common for a model to stop too early and fail to list all relevant excerpts. In that case, better performance can often be obtained by prompting the model with followup queries to find any excerpts it missed on previous passes.

SYSTEM
You will be provided with a document delimited by triple quotes. Your task is to select excerpts which pertain to the following question: "What significant paradigm shifts have occurred in the history of artificial intelligence."

Ensure that excerpts contain all relevant context needed to interpret them - in other words don't extract small snippets that are missing important context. Provide output in JSON format as follows:

[{"excerpt": "..."},
...
{"excerpt": "..."}]
USER
"""<insert document here>"""
ASSISTANT
[{"excerpt": "the model writes an excerpt here"},
...
{"excerpt": "the model writes another excerpt here"}]
USER
Are there more relevant excerpts? Take care not to repeat excerpts. Also ensure that excerpts contain all relevant context needed to interpret them - in other words don't extract small snippets that are missing important context.
Open in Playground
Strategy: Use external tools
Tactic: Use embeddings-based search to implement efficient knowledge retrieval
A model can leverage external sources of information if provided as part of its input. This can help the model to generate more informed and up-to-date responses. For example, if a user asks a question about a specific movie, it may be useful to add high quality information about the movie (e.g. actors, director, etc…) to the model’s input. Embeddings can be used to implement efficient knowledge retrieval, so that relevant information can be added to the model input dynamically at run-time.

A text embedding is a vector that can measure the relatedness between text strings. Similar or relevant strings will be closer together than unrelated strings. This fact, along with the existence of fast vector search algorithms means that embeddings can be used to implement efficient knowledge retrieval. In particular, a text corpus can be split up into chunks, and each chunk can be embedded and stored. Then a given query can be embedded and vector search can be performed to find the embedded chunks of text from the corpus that are most related to the query (i.e. closest together in the embedding space).

Example implementations can be found in the OpenAI Cookbook. See the tactic “Instruct the model to use retrieved knowledge to answer queries” for an example of how to use knowledge retrieval to minimize the likelihood that a model will make up incorrect facts.

Tactic: Use code execution to perform more accurate calculations or call external APIs
Language models cannot be relied upon to perform arithmetic or long calculations accurately on their own. In cases where this is needed, a model can be instructed to write and run code instead of making its own calculations. In particular, a model can be instructed to put code that is meant to be run into a designated format such as triple backtick. After an output is produced, the code can be extracted and run. Finally, if necessary, the output from the code execution engine (i.e.  interpreter) can be provided as an input to the model for the next query.

SYSTEM
You can write and execute  code by enclosing it in triple backticks, e.g.. Use this to perform calculations.
USER
Find all real-valued roots of the following polynomial: 3*x**5 - 5*x**4 - 3*x**3 - 7*x - 10.
Open in Playground
Another good use case for code execution is calling external APIs. If a model is instructed in the proper use of an API, it can write code that makes use of it. A model can be instructed in how to use an API by providing it with documentation and/or code samples showing how to use the API.

SYSTEM
You can write and execute  code by enclosing it in triple backticks. Also note that you have access to the following module to help users send messages to their friends:

Open in Playground
WARNING: Executing code produced by a model is not inherently safe and precautions should be taken in any application that seeks to do this. In particular, a sandboxed code execution environment is needed to limit the harm that untrusted code could cause.

Tactic: Give the model access to specific functions
The Chat Completions API allows passing a list of function descriptions in requests. This enables models to generate function arguments according to the provided schemas. Generated function arguments are returned by the API in JSON format and can be used to execute function calls. Output provided by function calls can then be fed back into a model in the following request to close the loop. This is the recommended way of using OpenAI models to call external functions. To learn more see the function calling section in our introductory text generation guide and more function calling examples in the OpenAI Cookbook.

Strategy: Test changes systematically
Sometimes it can be hard to tell whether a change — e.g., a new instruction or a new design — makes your system better or worse. Looking at a few examples may hint at which is better, but with small sample sizes it can be hard to distinguish between a true improvement or random luck. Maybe the change helps performance on some inputs, but hurts performance on others.

Evaluation procedures (or "evals") are useful for optimizing system designs. Good evals are:

Representative of real-world usage (or at least diverse)
Contain many test cases for greater statistical power (see table below for guidelines)
Easy to automate or repeat
DIFFERENCE TO DETECT	SAMPLE SIZE NEEDED FOR 95% CONFIDENCE
30%	~10
10%	~100
3%	~1,000
1%	~10,000
Evaluation of outputs can be done by computers, humans, or a mix. Computers can automate evals with objective criteria (e.g., questions with single correct answers) as well as some subjective or fuzzy criteria, in which model outputs are evaluated by other model queries. OpenAI Evals is an open-source software framework that provides tools for creating automated evals.

Model-based evals can be useful when there exists a range of possible outputs that would be considered equally high in quality (e.g. for questions with long answers). The boundary between what can be realistically evaluated with a model-based eval and what requires a human to evaluate is fuzzy and is constantly shifting as models become more capable. We encourage experimentation to figure out how well model-based evals can work for your use case.

Tactic: Evaluate model outputs with reference to gold-standard answers
Suppose it is known that the correct answer to a question should make reference to a specific set of known facts. Then we can use a model query to count how many of the required facts are included in the answer.

For example, using the following system message:

SYSTEM
You will be provided with text delimited by triple quotes that is supposed to be the answer to a question. Check if the following pieces of information are directly contained in the answer:

- Neil Armstrong was the first person to walk on the moon.
- The date Neil Armstrong first walked on the moon was July 21, 1969.

For each of these points perform the following steps:

1 - Restate the point.
2 - Provide a citation from the answer which is closest to this point.
3 - Consider if someone reading the citation who doesn't know the topic could directly infer the point. Explain why or why not before making up your mind.
4 - Write "yes" if the answer to 3 was yes, otherwise write "no".

Finally, provide a count of how many "yes" answers there are. Provide this count as {"count": <insert count here>}.
Open in Playground
Here's an example input where both points are satisfied:

SYSTEM
<insert system message above>
USER
"""Neil Armstrong is famous for being the first human to set foot on the Moon. This historic event took place on July 21, 1969, during the Apollo 11 mission."""
Open in Playground
Here's an example input where only one point is satisfied:

SYSTEM
<insert system message above>
USER
"""Neil Armstrong made history when he stepped off the lunar module, becoming the first person to walk on the moon."""
Open in Playground
Here's an example input where none are satisfied:

SYSTEM
<insert system message above>
USER
"""In the summer of '69, a voyage grand,
Apollo 11, bold as legend's hand.
Armstrong took a step, history unfurled,
"One small step," he said, for a new world."""
Open in Playground
There are many possible variants on this type of model-based eval. Consider the following variation which tracks the kind of overlap between the candidate answer and the gold-standard answer, and also tracks whether the candidate answer contradicts any part of the gold-standard answer.

SYSTEM
Use the following steps to respond to user inputs. Fully restate each step before proceeding. i.e. "Step 1: Reason...".

Step 1: Reason step-by-step about whether the information in the submitted answer compared to the expert answer is either: disjoint, equal, a subset, a superset, or overlapping (i.e. some intersection but not subset/superset).

Step 2: Reason step-by-step about whether the submitted answer contradicts any aspect of the expert answer.

Step 3: Output a JSON object structured like: {"type_of_overlap": "disjoint" or "equal" or "subset" or "superset" or "overlapping", "contradiction": true or false}
Open in Playground
Here's an example input with a substandard answer which nonetheless does not contradict the expert answer:

SYSTEM
<insert system message above>
USER
Question: """What event is Neil Armstrong most famous for and on what date did it occur? Assume UTC time."""

Submitted Answer: """Didn't he walk on the moon or something?"""

Expert Answer: """Neil Armstrong is most famous for being the first person to walk on the moon. This historic event occurred on July 21, 1969."""
Open in Playground
Here's an example input with answer that directly contradicts the expert answer:

SYSTEM
<insert system message above>
USER
Question: """What event is Neil Armstrong most famous for and on what date did it occur? Assume UTC time."""

Submitted Answer: """On the 21st of July 1969, Neil Armstrong became the second person to walk on the moon, following after Buzz Aldrin."""

Expert Answer: """Neil Armstrong is most famous for being the first person to walk on the moon. This historic event occurred on July 21, 1969."""
Open in Playground
Here's an example input with a correct answer that also provides a bit more detail than is necessary:

SYSTEM
<insert system message above>
USER
Question: """What event is Neil Armstrong most famous for and on what date did it occur? Assume UTC time."""

Submitted Answer: """At approximately 02:56 UTC on July 21st 1969, Neil Armstrong became the first human to set foot on the lunar surface, marking a monumental achievement in human history."""

Expert Answer: """Neil Armstrong is most famous for being the first person to walk on the moon. This historic event occurred on July 21, 1969."""
Open in Playground

`;
