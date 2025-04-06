import { AgentModelName, ConversationChannel } from '@chaindesk/prisma';

const config = {
  defaultDatasourceChunkSize: 1024,
  datasourceTable: {
    limit: 20,
  },
  demoBookingURL: 'https://calendar.app.google/C65KZcdgA9SBYQfBA',
};

export const XPBNPLabels = {
  qa: 'Question/Réponse sur documents',
  writing: 'Rédaction',
  summary: "Résumé d'un document",
};

export const ModelConfig: Record<
  AgentModelName,
  {
    name: string;
    maxTokens: number;
    cost: number;
    providerPriceByInputToken: number;
    providerPricePriceByOutputToken: number;
    baseUrl?: string;
    isVisionSupported?: boolean;
    isToolCallingSupported?: boolean;
    hasVision?: boolean;
    foundingModel?: string;
    icon?: string;
  }
> = {
  [AgentModelName.gpt_4o]: {
    name: 'gpt-4o',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/openai.svg',
    hasVision: true,
    foundingModel: "azure"
  },
  [AgentModelName.gpt_4o_mini]: {
    name: 'gpt-4o-mini',
    maxTokens: 128000,
    cost: 1,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/openai.svg',
    hasVision: true,
    foundingModel: "azure"
  },
  [AgentModelName.gpt_o3_mini]: {
    name: 'o3-mini',
    maxTokens: 128000,
    cost: 5,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/openai.svg',
    hasVision: true,
    foundingModel: "azure-2"
  },
  [AgentModelName.claude_3_haiku]: {
    name: 'anthropic.claude-3-haiku-20240307-v1:0',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/anthropic.svg',
    hasVision: true,
    foundingModel: "aws"
  },
  [AgentModelName.claude_3_sonnet]: {
    name: 'anthropic.claude-3-sonnet-20240229-v1:0',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/anthropic.svg',
    hasVision: true,
    foundingModel: "aws"
  },
  [AgentModelName.claude_3_5_sonnet]: {
    name: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/anthropic.svg',
    hasVision: true,
    foundingModel: "aws"
  },
  [AgentModelName.claude_3_5_v2_sonnet]: {
    name: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/anthropic.svg',
    hasVision: true,
    foundingModel: "aws"
  },
  [AgentModelName.claude_3_5_v2_haiku]: {
    name: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    maxTokens: 128000,
    cost: 8,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/anthropic.svg',
    hasVision: true,
    foundingModel: "aws"
  },
  [AgentModelName.mixtral_8x7b]: {
    name: 'mistral.mixtral-8x7b-instruct-v0:1',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/mistral.svg',
    hasVision: true,
    foundingModel: "aws"
  },
  [AgentModelName.mixtral_small]: {
    name: 'mistral.mistral-small-2402-v1:0',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/mistral.svg',
    hasVision: true,
    foundingModel: "aws"
  },
  [AgentModelName.mixtral_large]: {
    name: 'mistral.mistral-large-2402-v1:0',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/mistral.svg',
    hasVision: true,
    foundingModel: "aws"
  },
  [AgentModelName.command_r_plus]: {
    name: 'cohere.command-r-plus-v1:0',
    maxTokens: 128000,
    cost: 11,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/command.svg',
    hasVision: false,
    foundingModel: "aws"
  },
  // llama
  [AgentModelName.llama_3_3_70b]: {
    name: 'llama-3.3-70b-versatile',
    maxTokens: 128000,
    cost: 5,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: false,
    icon: '/shared/images/logos/meta.svg',
    hasVision: false,
    foundingModel: "groq-cloud"
  },
  [AgentModelName.llama_3_2_11b]: {
    name: 'us.meta.llama3-2-11b-instruct-v1:0',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: false,
    icon: '/shared/images/logos/meta.svg',
    hasVision: false,
    foundingModel: "aws"
  },
  [AgentModelName.llama_3_2_90b]: {
    name: 'us.meta.llama3-2-90b-instruct-v1:0',
    maxTokens: 128000,
    cost: 5,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: false,
    icon: '/shared/images/logos/meta.svg',
    hasVision: false,
    foundingModel: "aws"
  },
  [AgentModelName.llama_3_2_1b]: {
    name: 'us.meta.llama3-2-1b-instruct-v1:0',
    maxTokens: 128000,
    cost: 5,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: false,
    icon: '/shared/images/logos/meta.svg',
    hasVision: false,
    foundingModel: "aws"
  },
  [AgentModelName.llama_3_2_3b]: {
    name: 'us.meta.llama3-2-3b-instruct-v1:0',
    maxTokens: 128000,
    cost: 5,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: false,
    icon: '/shared/images/logos/meta.svg',
    hasVision: false,
    foundingModel: "aws"
  },
  [AgentModelName.llama_3_8b]: {
    name: 'llama-3.1-8b-instant', // us.meta.llama3-8b-instruct-v1:0
    maxTokens: 128000,
    cost: 7,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/meta.svg',
    hasVision: false,
    foundingModel: "groq-cloud"
  },

  // Modelos no configurados
  gpt_3_5_turbo: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  gpt_3_5_turbo_16k: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  gpt_4: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  gpt_4_32k: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  gpt_4_turbo: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  gpt_4_turbo_vision: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  claude_3_opus: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  mixtral_8x22b: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  dolphin_mixtral_8x7b: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  [AgentModelName.gpt_o1]: {
    name: 'o1',
    maxTokens: 128000,
    cost: 1,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/openai.svg',
    hasVision: true,
    foundingModel: "azure-2"
  },
  [AgentModelName.gpt_o1_mini]: {
    name: 'o1-mini',
    maxTokens: 128000,
    cost: 10,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/openai.svg',
    hasVision: true,
    foundingModel: "azure-2"
  },
  [AgentModelName.deepseek_r1]: {
    name: 'deepseek-r1-distill-llama-70b',
    maxTokens: 128000,
    cost: 3,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: false,
    icon: '/shared/images/logos/deepseek.svg',
    hasVision: false,
    foundingModel: "groq-cloud"
  },
  [AgentModelName.deepseek_v3]: {
    name: 'deepseek-chat',
    maxTokens: 128000,
    cost: 3,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/deepseek.svg',
    hasVision: true,
    foundingModel: "deepseek"
  },
  [AgentModelName.llama_3_1_8b_instant]: {
    name: 'llama-3.1-8b-instant',
    maxTokens: 128000,
    cost: 7,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isToolCallingSupported: true,
    icon: '/shared/images/logos/meta.svg',
    hasVision: false,
    foundingModel: "groq-cloud"
  },
  llama_3_1_70b: {
    name: '',
    maxTokens: 0,
    cost: 0,
    providerPriceByInputToken: 0,
    providerPricePriceByOutputToken: 0,
    baseUrl: undefined,
    isVisionSupported: undefined,
    isToolCallingSupported: undefined,
    hasVision: undefined,
    foundingModel: undefined,
    icon: undefined
  },
  [AgentModelName.gemini_1_5_flash]: {
    name: 'gemini-1.5-flash-001',
    maxTokens: 128000,
    cost: 5,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isVisionSupported: true,
    isToolCallingSupported: true,
    hasVision: true,
    foundingModel: 'gemini',
    icon: '/shared/images/logos/gemini.svg',
  },
  [AgentModelName.gemini_2_0_flash]: {
    name: 'gemini-2.0-flash',
    maxTokens: 128000,
    cost: 3,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isVisionSupported: true,
    isToolCallingSupported: true,
    hasVision: true,
    foundingModel: 'gemini',
    icon: '/shared/images/logos/gemini.svg',
  },
  [AgentModelName.gemini_2_0_flash_thinking]: {
    name: 'gemini-2.0-flash',
    maxTokens: 128000,
    cost: 3,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isVisionSupported: true,
    isToolCallingSupported: true,
    hasVision: true,
    foundingModel: 'gemini',
    icon: '/shared/images/logos/gemini.svg',
  },
  [AgentModelName.gemini_2_0_flash_thinking_app]: {
    name: 'gemini-2.0-flash',
    maxTokens: 128000,
    cost: 3,
    providerPriceByInputToken: 0.000005,
    providerPricePriceByOutputToken: 0.000015,
    isVisionSupported: true,
    isToolCallingSupported: true,
    hasVision: true,
    foundingModel: 'gemini',
    icon: '/shared/images/logos/gemini.svg',
  },
};

// src/config/modelDeployments.ts
export const deployNames: Record<AgentModelName, string> = {
  [AgentModelName.gpt_4o]: 'gpt-4o',
  [AgentModelName.gpt_4o_mini]: 'gpt-4o-mini',
  [AgentModelName.claude_3_haiku]: 'anthropic.claude-3-haiku-20240307-v1:0',
  [AgentModelName.claude_3_sonnet]: 'anthropic.claude-3-sonnet-20240229-v1:0',
  [AgentModelName.claude_3_5_sonnet]: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  [AgentModelName.claude_3_5_v2_sonnet]: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  [AgentModelName.claude_3_5_v2_haiku]: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
  [AgentModelName.mixtral_8x7b]: 'mistral.mixtral-8x7b-instruct-v0:1',
  [AgentModelName.mixtral_small]: 'mistral.mistral-small-2402-v1:0',
  [AgentModelName.mixtral_large]: 'mistral.mistral-large-2402-v1:0',
  [AgentModelName.llama_3_1_70b]: 'us.meta.llama3-1-70b-instruct-v1:0',
  [AgentModelName.llama_3_2_11b]: 'us.meta.llama3-2-11b-instruct-v1:0',
  [AgentModelName.llama_3_2_90b]: 'us.meta.llama3-2-90b-instruct-v1:0',
  [AgentModelName.llama_3_2_1b]: 'us.meta.llama3-2-1b-instruct-v1:0',
  [AgentModelName.llama_3_2_3b]: 'us.meta.llama3-2-3b-instruct-v1:0',
  [AgentModelName.llama_3_8b]: 'llama-3.1-8b-instant',
  [AgentModelName.command_r_plus]: 'cohere.command-r-plus-v1:0',
  // Modelos no configurados
  gpt_3_5_turbo: '',
  gpt_3_5_turbo_16k: '',
  gpt_4: '',
  gpt_4_32k: '',
  gpt_4_turbo: '',
  gpt_4_turbo_vision: '',
  claude_3_opus: '',
  mixtral_8x22b: '',
  dolphin_mixtral_8x7b: '',
  [AgentModelName.gpt_o1_mini]: 'o1-mini',
  [AgentModelName.gpt_o1]: 'o1',
  [AgentModelName.deepseek_r1]: 'deepseek-reasoner',
  [AgentModelName.deepseek_v3]: 'deepseek-chat',
  [AgentModelName.llama_3_3_70b]: 'llama-3.3-70b-versatile',
  [AgentModelName.llama_3_1_8b_instant]: 'llama-3.1-8b-instant',
  [AgentModelName.gpt_o3_mini]: 'o3-mini',
  [AgentModelName.gemini_1_5_flash]: 'gemini-1.5-flash',
  [AgentModelName.gemini_2_0_flash]: 'gemini-2.0-flash',
  [AgentModelName.gemini_2_0_flash_thinking]: 'gemini-2.0-flash-thinking',
  [AgentModelName.gemini_2_0_flash_thinking_app]: 'gemini-2.0-flash-thinking-app'
};

export const appUrl = 'https://dashboard.chatsappai.com';
export const apiUrl = 'https://dashboard.chatsappai.com';
// export const appUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL as string;
// export const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;

export const youtubeSummaryTool = {
  sitemapPageSize: 1000,
  paginationLimit: 100,
};

export const channelConfig = {
  [ConversationChannel.api]: {
    isMarkdownCompatible: true,
  },
  [ConversationChannel.crisp]: {
    isMarkdownCompatible: false,
  },
  [ConversationChannel.dashboard]: {
    isMarkdownCompatible: true,
  },
  [ConversationChannel.form]: {
    isMarkdownCompatible: true,
  },
  [ConversationChannel.mail]: {
    isMarkdownCompatible: false,
  },
  [ConversationChannel.slack]: {
    isMarkdownCompatible: false,
  },
  [ConversationChannel.website]: {
    isMarkdownCompatible: true,
  },
  [ConversationChannel.whatsapp]: {
    isMarkdownCompatible: false,
  },
  [ConversationChannel.zapier]: {
    isMarkdownCompatible: true,
  },
} as Record<
  ConversationChannel,
  {
    isMarkdownCompatible: boolean;
  }
>;

export default config;
