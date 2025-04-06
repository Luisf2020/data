import cuid from 'cuid';
import { z } from 'zod';

import { Datastore, Tool, ToolType } from '@chaindesk/prisma';

import { ToolSchema } from './types/dtos';
import { Prettify } from './type-utilites';

const baseFormatSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

const datastoreFormatSchema = baseFormatSchema.extend({
  datastoreId: z.string(),
});

const formFormatSchema = baseFormatSchema.extend({
  formId: z.string(),
});

const formatSchema = z.discriminatedUnion('type', [
  datastoreFormatSchema.extend({ type: z.literal(ToolType.datastore) }),
  baseFormatSchema.extend({ type: z.literal(ToolType.app) }),
  baseFormatSchema.extend({ type: z.literal(ToolType.http) }),
  baseFormatSchema.extend({ type: z.literal(ToolType.request_human) }),
  baseFormatSchema.extend({ type: z.literal(ToolType.mark_as_resolved) }),
  baseFormatSchema.extend({ type: z.literal(ToolType.lead_capture) }),
  formFormatSchema.extend({ type: z.literal(ToolType.form) }),
]);

type Format = z.infer<typeof formatSchema>;

export type NormalizedTool = {
  id?: string;
  type: ToolType;
  name?: string;
  description?: string;
};

export const agentToolConfig = {
  [ToolType.datastore]: {
    icon: '🧠',
    title: `🧠 Datastore`,
    description: `Conecta datos personalizados a tu Agente`,
  },
  [ToolType.http]: {
    icon: '🛜',
    title: '🛜 HTTP Tool',
    description: `El agente puede realizar una solicitud HTTP a una API externa`,
  },
  [ToolType.app]: {
    icon: '🚀',
    title: '🚀 App',
    description: `El agente puede realizar una solicitud a una API externa para obtener datos o realizar acciones`,
  },
  [ToolType.form]: {
    icon: '📋',
    title: '📋 Form',
    description: `Conecta un formulario a tu Agente`,
  },
  [ToolType.mark_as_resolved]: {
    icon: '✅',
    title: '✅ Mark as Resolved',
    // description: `Agent can mark the conversation as resolved when relevant`,
    description: `El usuario puede marcar la conversación como resuelta`,
  },
  [ToolType.request_human]: {
    icon: '🙋‍♂️',
    title: '🙋‍♂️ Requiero asistencia',
    // description: `Agent can request a human intervention when user asks for it.`,
    description: `El usuario puede solicitar una operadora humano..`,
  },
  [ToolType.lead_capture]: {
    icon: '🎯',
    title: '🎯 Captura de Leads (⚠️ Obsoleto: Usa la herramienta de Formulario en su lugar)',
    description: `El agente puede recopilar el correo electrónico o número de teléfono del usuario`,
  },
};

export const createTool = (payload: ToolSchema) => ({
  ...payload,
  id: payload?.id || cuid(),
});

const agentToolFormat = (
  tool: Exclude<ToolSchema, { type: 'connector' } | { type: 'agent' }>
) => {
  let format = {
    name: tool.type,
    description: '',
  } as Format;

  const icon = (agentToolConfig as any)?.[tool.type]?.icon as string;

  if (tool.type === ToolType.datastore) {
    format = {
      id: tool.id!,
      datastoreId: tool.datastoreId!,
      type: tool.type,
      name:
        ((tool as any)?.datastore?.name!
          ? `${icon} ` + (tool as any)?.datastore?.name!
          : undefined) || agentToolConfig[ToolType.datastore].description,
      description:
        ((tool as any)?.datastore?.description as string) ||
        agentToolConfig[ToolType.datastore].description,
    };
  } else if (tool.type === ToolType.http) {
    format = {
      id: tool.id!,
      name:
        (tool?.config?.name ? `${icon} ` + tool?.config?.name : undefined) ||
        agentToolConfig[ToolType.http].title,
      type: tool.type,
      description:
        tool?.config?.description || agentToolConfig[ToolType.http].description,
    };
  } else if (tool.type === ToolType.app) {
    format = {
      id: tool.id!,
      // logo: tool?.config?.logo,
      name:
        (tool?.config?.name ? `${icon} ` + tool?.config?.name : undefined) ||
        agentToolConfig[ToolType.app].title,
      type: tool.type,
      description:
        tool?.config?.description || agentToolConfig[ToolType.app].description,
    };
  } else if (tool.type === ToolType.form) {
    format = {
      id: tool.id!,
      formId: tool?.formId,
      type: tool.type,
      name:
        (tool?.form?.name ? `${icon} ` + tool?.form?.name : undefined) ||
        agentToolConfig[ToolType.form].title,
      description:
        tool?.form?.description || agentToolConfig[ToolType.form].description,
    };
  } else {
    format = {
      id: tool.id!,
      type: tool.type,
      name: (agentToolConfig as any)[tool?.type]?.title || tool.type,
      description: (agentToolConfig as any)[tool?.type]?.description || '',
    };
  }

  return {
    ...tool,
    ...format,
  };
};

export default agentToolFormat;
