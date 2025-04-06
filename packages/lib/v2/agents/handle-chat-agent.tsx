import Prisma from '@prisma/client';
import axios from 'axios';
import cuid from 'cuid';
import type { Logger } from 'pino';
import React from 'react';

import { GenericTemplate, NewConversation, render } from '@chaindesk/emails';
import guardAgentQueryUsage from '@chaindesk/lib/guard-agent-query-usage';
import { sharp } from '@chaindesk/lib/image';
import {
  ConversationChannel,
  ConversationStatus,
  MembershipRole,
  MessageFrom,
  Prisma as PrismaType,
  PromptType,
  ToolType,
  Usage,
} from '@chaindesk/prisma';
import prisma from '@chaindesk/prisma/client';

import EventDispatcher from '../../events/dispatcher';
import { fileBufferToDocs } from '../../loaders/file';
import { ChatRequest } from '../../types/dtos';
import { AcceptedAIEnabledMimeTypes } from '../../accepted-mime-types';
import AgentManager from '../../agent';
import { AnalyticsEvents, capture } from '../../analytics-server';
import { formatOrganizationSession, sessionOrganizationInclude } from '../../auth';
import { channelConfig, ModelConfig } from '../../config';
import ConversationManager from '../../conversation';
import getRequestLocation from '../../get-request-location';
import mailer from '../../mailer';
import { CUSTOMER_SUPPORT_BASE } from '../../prompt-templates';
import { MessageSplitter } from '../../MessageSplitter';

export const ChatConversationArgs =
  PrismaType.validator<PrismaType.ConversationDefaultArgs>()({
    include: {
      lead: true,
      participantsContacts: {
        take: 1,
      },
      messages: {
        take: -24,
        orderBy: {
          createdAt: 'asc',
        },
      },
      attachments: {
        where: {
          mimeType: {
            in: AcceptedAIEnabledMimeTypes,
          },
        },
      },
    },
  });

export type ChatConversationArgs = PrismaType.ConversationGetPayload<
  typeof ChatConversationArgs
>;

export const ChatAgentArgs = PrismaType.validator<PrismaType.AgentDefaultArgs>()({
  include: {
    tools: {
      include: {
        datastore: true,
        form: true,
      },
    },
    organization: {
      include: {
        ...sessionOrganizationInclude,
        memberships: {
          where: {
            role: MembershipRole.OWNER,
          },
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    },
  },
});

export type ChatAgentArgs = PrismaType.AgentGetPayload<typeof ChatAgentArgs>;

type Props = Omit<ChatRequest, 'isDraft' | 'streaming'> & {
  logger?: Logger;
  location?: ReturnType<typeof getRequestLocation>;
  userId?: string;
  agent: ChatAgentArgs;
  conversation?: ChatConversationArgs;
  handleStream?: any;
  abortController?: any;
  isDraft?: boolean;
  streaming?: boolean;
  channelExternalId?: string;
  channelCredentialsId?: string;
  externalMessageId?: string;
  externalVisitorId?: string;
  contextDataAgents?: string;
};

async function handleChatMessage({ agent, conversation, ...data }: Props) {
  const usage = agent?.organization?.usage;

  const isNewConversation = !conversation?.id;
  const history = conversation?.messages || [];
  const channel = (data.channel ||
    ConversationChannel.dashboard) as ConversationChannel;
  const conversationId = conversation?.id || data.conversationId || cuid();
  const isDashboardMessage =
    channel === ConversationChannel.dashboard && !!data.userId;
  const visitorId = String(data.visitorId || cuid());

  let retrievalQuery = '';
  if (data.isDraft) {
    // Solo usamos datastore cuando se está redactando una respuesta
    agent.tools = agent.tools?.filter((each) => each?.type === 'datastore');
    agent.modelName = 'gpt_3_5_turbo_16k';
    const lastFromHumanIndex = history
      .reverse()
      .findIndex((one) => one.from === MessageFrom.human);
    retrievalQuery = history?.[lastFromHumanIndex]?.text || '';
  }

  if (data.modelName) {
    // Sobrescribir modelName si se indica
    agent.modelName = data.modelName;
  }

  // promptType está en desuso, se aplica un parche hasta que se soporte por completo
  if (data.promptType === PromptType.raw && data.promptTemplate) {
    agent.systemPrompt = '';
    agent.userPrompt = data.promptTemplate;
  } else if (data.promptType === PromptType.customer_support) {
    agent.systemPrompt = `${data.promptTemplate || agent.prompt} ${CUSTOMER_SUPPORT_BASE}`;
    agent.userPrompt = `{query}`;
  }

  if (data?.context?.trim()) {
    agent.systemPrompt = `${agent.systemPrompt}\n${data?.context?.trim()}`;
  }
  const filteredTools = (agent?.tools || []).filter((each) => {
    if (each?.type === ToolType.lead_capture) {
      // Deshabilitado para estos canales
      if (
        [
          ConversationChannel.api,
          ConversationChannel.crisp,
          ConversationChannel.website,
          ConversationChannel.dashboard,
        ].includes(channel as any)
      ) {
        return false;
      }

      if (conversation?.status === ConversationStatus.HUMAN_REQUESTED) {
        return false;
      }

      // Ya se capturó lead o contacto para la conversación
      if (
        !!conversation?.lead ||
        (conversation?.participantsContacts || [])?.length > 0
      ) {
        return false;
      }
    } else if (
      each?.type === ToolType.request_human ||
      each?.type === ToolType.mark_as_resolved
    ) {
      return true;
    }
    return true;
  });

  // Deshabilitar markdown para canales no compatibles
  if (channelConfig[channel]?.isMarkdownCompatible === false) {
    agent.useMarkdown = false;
  }

  agent.tools = filteredTools;

  console.log('This agent cooming');
  const manager = new AgentManager({ agent, topK: 50 });

  const conversationManager = new ConversationManager({
    channel,
    organizationId: agent?.organizationId!,
    formId: data.formId!,
    conversationId,
    channelExternalId: data?.channelExternalId,
    channelCredentialsId: data?.channelCredentialsId,
    ...(!data.userId && !!isNewConversation && data?.location?.country
      ? {
        metadata: {
          country: data.location.country,
        },
      }
      : {}),
    location: data.location,
  });

  // Eliminamos la creación de mensajes del humano 📭❌  
  // ---------------------------------------------------

  // Si la conversación existe y no está habilitada para IA, salimos
  if (!!conversation && !conversation?.isAiEnabled) {
    console.log("query: " + data.query);
    return {
      inputMessageId: undefined,
      conversationId,
      agentResponse: undefined,
      answerMsgId: undefined,
      humand_request: conversation?.isAiEnabled,
      status: conversation?.status,
    };
  }

  try {
    const orgSession = formatOrganizationSession(agent?.organization!);
    const usage = orgSession?.usage as Usage;

    guardAgentQueryUsage({
      usage: usage!,
      plan: orgSession?.currentPlan,
    });
  } catch (err) {
    console.log('Error guardAgentQueryUsage:', err);

    const email = agent?.organization?.memberships?.[0]?.user?.email!;

    if (
      process.env.NODE_ENV === 'production' &&
      !usage?.notifiedAgentQueriesLimitReached &&
      email
    ) {
      await Promise.all([
        mailer.sendMail({
          from: {
            name: 'ChatsappAI',
            address: process.env.EMAIL_FROM!,
          },
          to: email,
          subject: `Has alcanzado tu límite de uso`,
          html: render(
            <GenericTemplate
              title={'🚨 Límite de Uso Alcanzado'}
              description="Has alcanzado tu cuota de consultas de Agente. Tu Agente no podrá responder consultas hasta que actualices tu cuenta."
              cta={{
                label: 'Actualizar Cuenta',
                href: `https://dashboard.chatsappai.com/settings/billing`,
              }}
            />
          ),
        }),
        prisma.usage.update({
          where: {
            id: usage?.id,
          },
          data: {
            notifiedAgentQueriesLimitReached: true,
          },
        }),
      ]);
    }

    throw err;
  }

  // Procesamos los adjuntos para IA
  const attachhmentsForAI = [
    ...(data?.attachments || []),
    ...(conversation?.attachments?.filter((each) =>
      (data?.attachmentsForAI || [])?.includes(each?.id)
    ) || []),
  ];

  console.log('Attachments for AI:', attachhmentsForAI);

  const nonImageAttachmentsForAI = attachhmentsForAI.filter(
    (each) => !each?.mimeType?.startsWith('image')
  );
  console.log('Non-image Attachments for AI:', nonImageAttachmentsForAI);

  let _imageAttachmentsForAI = attachhmentsForAI
    .filter((each) => each?.mimeType?.startsWith('image'))
    .map((each) => each.url);

  console.log('Image URLs for AI:', _imageAttachmentsForAI);

  let imageAttachmentsForAI = [] as string[];

  const encodeImageAsBase64 = async (url: string) => {
    const image = await fetch(url);
    const contentType = image.headers.get('Content-type');
    const imageBuffer = await image.arrayBuffer();

    return `data:${contentType};base64,${Buffer.from(
      await sharp(imageBuffer)
        .resize({
          fit: sharp.fit.contain,
          width: 100,
        })
        .toBuffer()
    ).toString('base64')}`;
  };

  for (const each of _imageAttachmentsForAI) {
    const base64 = await encodeImageAsBase64(each);
    imageAttachmentsForAI.push(base64);
  }

  console.log('Base64 Encoded Images for AI:', imageAttachmentsForAI);

  const attachmentsToText: string[] = [];
  for (const attachment of nonImageAttachmentsForAI) {
    const buffer = await axios
      .get(attachment.url, {
        responseType: 'arraybuffer',
      })
      .then((res) => res.data);

    const doc = await fileBufferToDocs({
      buffer,
      mimeType: attachment.mimeType,
    });

    const text = doc.map((each) => each.pageContent).join(' ');

    attachmentsToText.push(`FILENAME: ${attachment.name} CONTENT: ${text}`);
  }

  console.log('Attachments to Text:', attachmentsToText);

  const input = !!attachmentsToText?.length
    ? `${data.query}\n${attachmentsToText.join('\n###\n')}`
    : data.query;

  console.log('Input for Query:', input);

  const [chatRes] = await Promise.all([
    manager.query({
      ...data,
      conversationId,
      channel,
      input,
      stream: data.streaming ? data.handleStream : undefined,
      history: history,
      abortController: data.abortController,
      filters: data.filters,
      toolsConfig: data.toolsConfig,
      retrievalQuery,
      images: imageAttachmentsForAI,
    }),
    prisma.usage.update({
      where: {
        id: agent?.organization?.usage?.id,
      },
      data: {
        nbAgentQueries:
          (agent?.organization?.usage?.nbAgentQueries || 0) +
          (ModelConfig?.[agent?.modelName].cost || 1),
      },
    }),
  ]);

  console.log('Chat Response:', chatRes);

  let answerMsgId = chatRes.messageId || cuid();
  let createdMessages: Array<{ id: string; text: string }> = [];

  if (!data.isDraft) {
    if (agent.useConversationalMode) {
      const splitter = new MessageSplitter();
      const splittedMessages = await splitter.splitMessage(chatRes.answer);
      console.log('Splitted Messages:', splittedMessages);

      // Creamos los mensajes uno por uno de forma secuencial para preservar el orden
      for (const msg of splittedMessages) {
        await conversationManager.createMessage({
          id: msg.id,
          from: MessageFrom.agent,
          text: msg.content,
          sources: chatRes.sources,
          usage: chatRes.usage,
          approvals: chatRes.approvals,
          metadata: chatRes.metadata,
          agentId: agent?.id,
        });

        createdMessages.push({ id: msg.id, text: msg.content });
      }

      // Establecemos el answerMsgId como el ID del primer mensaje dividido
      answerMsgId = splittedMessages[0]?.id || answerMsgId;
    } else {
      await conversationManager.createMessage({
        id: cuid(),
        // inputId: inputMessageId,
        from: MessageFrom.agent,
        text: chatRes.answer,
        sources: chatRes.sources,
        usage: chatRes.usage,
        approvals: chatRes.approvals,
        metadata: chatRes.metadata,
        agentId: agent?.id,
      });
    }

    if (chatRes.approvals.length > 0) {
      await EventDispatcher.dispatch({
        type: 'tool-approval-requested',
        conversationId,
        approvals: chatRes.approvals,
        agentName: agent?.name!,
      });
    }
  }

  // Notificación de nueva conversación (opcional, se mantiene si aplica)
  const ownerEmail = agent?.organization?.memberships?.[0]?.user?.email;
  if (
    !data.isDraft &&
    ownerEmail &&
    isNewConversation &&
    data.channel === ConversationChannel.website &&
    !data.userId &&
    process.env.NODE_ENV === 'production'
  ) {
    try {
      await mailer.sendMail({
        from: {
          name: 'ChatsappAI',
          address: process.env.EMAIL_FROM!,
        },
        to: ownerEmail,
        subject: `💬 New conversation started with Agent ${agent?.name}`,
        html: render(
          <NewConversation
            agentName={agent.name}
            messages={[
              {
                id: '1',
                text: data.query,
                from: MessageFrom.human,
              },
              {
                id: '2',
                text: chatRes.answer,
                from: MessageFrom.agent,
              },
            ]}
            ctaLink={`${process.env.NEXT_PUBLIC_DASHBOARD_URL}/logs?tab=all&targetConversationId=${encodeURIComponent(
              conversationId
            )}&targetOrgId=${encodeURIComponent(agent.organizationId!)}`}
          />
        ),
      });
    } catch (err) {
      data?.logger?.error?.(err);
    }
  }

  const updatedConversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { status: true, isAiEnabled: true },
  });

  console.log('Updated Conversation:', updatedConversation);

  capture?.({
    event: data.userId
      ? AnalyticsEvents.INTERNAL_AGENT_QUERY
      : AnalyticsEvents.EXTERNAL_AGENT_QUERY,
    payload: {
      isDraft: data.isDraft,
      userId: data.userId,
      agentId: agent?.id,
      organizationId: agent?.organizationId,
    },
  });

  console.log('-------------------------CHATRES HANDLE MESSAGE');
  console.log({
    agentResponse: chatRes,
    // inputMessageId,
    answerMsgId,
    conversationId,
    humand_request: updatedConversation?.isAiEnabled ?? null,
    status: updatedConversation?.status ?? null,
  });
  console.log('-------------------------CHATRES HANDLE MESSAGE');

  return {
    agentResponse: chatRes,
    // inputMessageId,
    answerMsgId,
    conversationId,
    humand_request: updatedConversation?.isAiEnabled,
    status: updatedConversation?.status,
    agentMessages: createdMessages,
  };
}

export default handleChatMessage;
