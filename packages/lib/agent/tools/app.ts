import { ModelConfig } from '@chaindesk/lib/config';
import { countTokensEstimation } from '@chaindesk/lib/count-tokens';
import createToolParser from '@chaindesk/lib/create-tool-parser';
import { AppToolSchema } from '@chaindesk/lib/types/dtos';
import { AgentModelName } from '@chaindesk/prisma';
import { OpenAIToolSet } from "composio-core";
import splitTextIntoChunks from '@chaindesk/lib/split-text-by-token';
import { AppToolResponseSchema, CreateAppHandlerConfig } from "./type";

export type AppToolPayload = {
  [key: string]: unknown;
};

export const toJsonSchema = async (tool: AppToolSchema) => {
  console.log('Initializing Composio toolset');
  const composio_toolset = new OpenAIToolSet();

  console.log('Fetching action schema');
  if (!tool.config.actionId) {
    throw new Error('actionId is required and cannot be undefined');
  }
  const actionSchema = await composio_toolset.getActionsSchema({
    actions: [tool.config.actionId],
  });

  console.log('Returning JSON schema');
  return {
    name: `${tool.id}`,
    description: tool?.config?.description,
    parameters: actionSchema[0].parameters || {
      type: 'object',
      properties: {},
      required: [],
    },
  };
};

export const createHandler =
  (
    appTool: AppToolSchema,
    toolHandlerConfig?: CreateAppHandlerConfig<{ type: 'app' }>
  ) =>
    async (payload: AppToolPayload): Promise<AppToolResponseSchema> => {
      const config = appTool?.config;

      console.log('Checking if approval is required');
      if (config?.withApproval) {
        return {
          approvalRequired: true,
        };
      }

      try {
        console.log('Initializing Composio');
        const toolset = new OpenAIToolSet();
        const entity = toolset.client.getEntity(config.entityId);

        console.log('Preparing parameters');
        const params = {
          ...config?.body
            ?.filter((each) => !each.isUserProvided)
            .reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}),
          ...config?.body
            ?.filter((each) => !!each.isUserProvided)
            .reduce((acc, curr) => ({ ...acc, [curr.key]: payload[curr.key] }), {}),
          ...config?.queryParameters
            ?.filter((each) => !!each.isUserProvided)
            .reduce((acc, curr) => ({ ...acc, [curr.key]: payload[curr.key] }), {}),
        };

        console.log('Composio Tool Params', {
          actionName: config.actionId,
          params,
        });

        console.log('Executing action in Composio');
        const result = await entity.execute({
          actionName: config.actionId || '',
          params: params,
        });

        console.log('Handling token limits');
        const MAX_TOKENS =
          ModelConfig[
            toolHandlerConfig?.modelName || AgentModelName.gpt_3_5_turbo_16k
          ].maxTokens * 0.7;

        const totalTokens = countTokensEstimation({ text: JSON.stringify(result) });

        let processedResult = result;
        if (totalTokens > MAX_TOKENS) {
          console.log('Splitting text into chunks');
          const chunks = await splitTextIntoChunks({
            text: JSON.stringify(result),
            chunkSize: MAX_TOKENS,
          });

          processedResult = JSON.parse(chunks[0]);
        }

        console.log('Returning processed result');
        return { data: processedResult };
      } catch (err) {
        console.log('Composio Tool Error', err);
        return {
          data: 'The Composio tool has failed. You need to answer the user query based on the general knowledge. If you cannot fulfill the user request, inform them that the call has failed and to try again later.',
        };
      }
    };

export const createParser = (tool: AppToolSchema, config: any) => async (
  payload: string
) => {
  try {
    console.log('Fetching JSON schema');
    const schema = await toJsonSchema(tool);

    console.log('Parsing payload');
    const parsedPayload = JSON.parse(payload);

    console.log('Normalizing payload');
    const normalizedPayload = Object.entries(parsedPayload).reduce((acc, [key, value]) => {
      // If the schema expects a boolean and the value comes as a string, we convert it
      if (
        schema.parameters?.properties?.[key]?.type === 'boolean' &&
        typeof value === 'string'
      ) {
        (acc as any)[key] = value.toLowerCase() === 'true';
      } else {
        (acc as any)[key] = value;
      }
      return acc;
    }, {});

    // We check the 'attachment' property and remove it if it is not a valid object
    if (
      'attachment' in normalizedPayload &&
      (typeof normalizedPayload.attachment !== 'object' || normalizedPayload.attachment === null)
    ) {
      console.warn(
        'The "attachment" property is not a valid object and will be removed to avoid validation errors.'
      );
      delete normalizedPayload.attachment;
    }

    console.log('Creating tool parser');
    return createToolParser(schema.parameters)(JSON.stringify(normalizedPayload));
  } catch (err) {
    console.log('Parser Error', err);
    throw err;
  }
};
