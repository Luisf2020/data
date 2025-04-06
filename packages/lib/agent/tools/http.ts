import axios, { AxiosRequestConfig } from 'axios';
import { ModelConfig } from '@chaindesk/lib/config';
import { countTokensEstimation } from '@chaindesk/lib/count-tokens';
import createToolParser from '@chaindesk/lib/create-tool-parser';
import splitTextIntoChunks from '@chaindesk/lib/split-text-by-token';
import { AgentModelName } from '@chaindesk/prisma';
import { CreateToolHandlerConfig, HttpToolResponseSchema } from './type';

export type HttpToolPayload = { [key: string]: unknown };

/* =============================================================================
   TYPE DEFINITIONS & INTERFACES
============================================================================= */

// A property in our JSON Schema
interface SchemaProperty {
  type: string;
  description: string;
  enum?: string[];
}

// JSON Schema interface for parameters
interface JSONSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

// Adapted HttpToolSchema interface—adjust to your actual definition
interface HttpToolSchema {
  id: string;
  config: {
    name?: string;
    description?: string;
    headers?: Array<{
      key: string;
      description?: string;
      isUserProvided: boolean;
      enum?: string[];
      value?: string;
    }>;
    body?: Array<{
      key: string;
      description?: string;
      isUserProvided: boolean;
      enum?: string[];
      value?: string;
    }>;
    queryParameters?: Array<{
      key: string;
      description?: string;
      isUserProvided: boolean;
      enum?: string[];
      value?: string;
    }>;
    url: string;
    method?: string;
    withApproval?: boolean;
  };
}

/* =============================================================================
   UTILITY FUNCTIONS
============================================================================= */

/**
 * Converts a list of items (e.g. headers, body, or query parameters) into a
 * JSON Schema properties object. Only includes items marked as user provided.
 */
const buildProperties = (
  items: Array<{ key: string; description?: string; isUserProvided: boolean; enum?: string[] }>
): Record<string, SchemaProperty> =>
  items
    .filter(item => item.isUserProvided)
    .reduce((acc, item) => {
      acc[item.key] = {
        type: 'string', // Change this if you expect other types
        description: item.description || '',
        ...(item.enum ? { enum: item.enum } : {})
      };
      return acc;
    }, {} as Record<string, SchemaProperty>);

/**
 * Validates whether a string is valid JSON.
 */
const isJsonString = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Converts a valid JSON string into an object.
 */
const processData = (data: any): any =>
  typeof data === 'string' && isJsonString(data) ? JSON.parse(data) : data;

/**
 * Merges query parameters from the tool config and payload into a final query string.
 */
const buildQueryParams = (
  url: URL,
  configQueryParams: Array<{ key: string; value?: string }>,
  payload: HttpToolPayload
): string => {
  const params = new URLSearchParams(url.search);
  configQueryParams.forEach(param => {
    if (param.value) {
      params.set(param.key, param.value);
    } else if (payload[param.key]) {
      params.set(param.key, `${payload[param.key]}`);
    }
  });
  return params.toString();
};

/**
 * Constructs the Axios request configuration.
 */
const buildAxiosConfig = (
  toolConfig: HttpToolSchema['config'],
  payload: HttpToolPayload,
  requestData: any,
  headers: Record<string, string>
): AxiosRequestConfig => {
  const method = toolConfig.method ? toolConfig.method.toUpperCase() : 'GET';
  return {
    method,
    headers,
    ...(method !== 'GET' && { data: requestData })
  };
};

/* =============================================================================
   JSON SCHEMA BUILDER
============================================================================= */

/**
 * Generates a robust JSON schema for a given tool.
 *
 * This function guarantees that:
 * - `parameters` always includes `"type": "object"`.
 * - `properties` is never empty (it uses a fallback default if necessary).
 *
 * This schema is then used for function declarations so that every tool's
 * parameters adhere to the required specification, preventing errors such as:
 * "parameters.type: must be specified when not using one_of".
 */
export const toJsonSchema = (tool: HttpToolSchema): { name: string; description: string; parameters: JSONSchema } => {
  // Build properties from headers, body, and query parameters
  const headerProps = buildProperties(tool.config.headers || []);
  const bodyProps = buildProperties(tool.config.body || []);
  const queryProps = buildProperties(tool.config.queryParameters || []);

  // Combine all properties
  let properties: Record<string, SchemaProperty> = { ...headerProps, ...bodyProps, ...queryProps };

  // Fallback: if no properties are defined, add a default property
  if (Object.keys(properties).length === 0) {
    properties = {
      defaultParam: {
        type: 'string',
        description: 'Default parameter since none were provided'
      }
    };
  }
  const rawName = tool.config.name?.replace(/[^a-zA-Z0-9_-]/g, '') || tool.id;
  return {
    name: rawName,
    description: tool.config.description || '',
    parameters: {
      type: 'object', // This is critical for proper JSON schema validation!
      properties,
      required: [] // Populate with required keys if needed
    }
  };
};

/* =============================================================================
   HTTP TOOL HANDLER
============================================================================= */

/**
 * Main handler for executing an HTTP tool.
 *
 * Responsibilities:
 * - Construct the final URL (with query parameters merged from config and payload).
 * - Prepare the request body and headers (static and dynamic).
 * - Execute the HTTP request using Axios.
 * - Process and optionally chunk the response to respect token limits.
 */
export const createHandler =
  (
    httpTool: HttpToolSchema,
    toolHandlerConfig?: CreateToolHandlerConfig<{ type: 'http' }>
  ) =>
    async (payload: HttpToolPayload): Promise<HttpToolResponseSchema> => {
      const config = httpTool.config;

      console.debug('[HTTP TOOL] Received payload:', payload);
      console.debug('[HTTP TOOL] Tool configuration:', config);

      if (config.withApproval) {
        return { approvalRequired: true };
      }

      // Build final URL with query parameters
      const inputUrl = new URL(config.url);
      const configQueryParams = (config.queryParameters || []).map(param => ({
        key: param.key,
        value: param.value
      }));
      const finalQueryString = buildQueryParams(inputUrl, configQueryParams, payload);
      const finalUrl = `${inputUrl.origin}${inputUrl.pathname}?${finalQueryString}`;
      console.debug('[HTTP TOOL] Final URL:', finalUrl);

      // Prepare request body (for non-GET methods)
      let requestData: any = {};
      if (config.method && config.method.toUpperCase() !== 'GET') {
        const staticBody = config.body
          ?.filter(item => !item.isUserProvided)
          .reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {} as Record<string, any>) || {};
        const dynamicBody = config.body
          ?.filter(item => item.isUserProvided)
          .reduce((acc, item) => ({ ...acc, [item.key]: payload[item.key] }), {} as Record<string, any>) || {};
        requestData = { ...staticBody, ...dynamicBody };

        if (requestData && typeof requestData.params === 'string' && isJsonString(requestData.params)) {
          requestData.params = processData(requestData.params);
        }
        console.debug('[HTTP TOOL] Processed request body:', requestData);
      }

      // Construct headers by merging base, static, and dynamic headers
      const baseHeaders: Record<string, string> = { 'Accept': 'application/json' };
      const staticHeaders = config.headers
        ?.filter(item => !item.isUserProvided)
        .reduce((acc, item) => ({ ...acc, [item.key]: item.value || '' }), {} as Record<string, string>) || {};
      const dynamicHeaders = config.headers
        ?.filter(item => item.isUserProvided)
        .reduce((acc, item) => ({ ...acc, [item.key]: payload[item.key] ? `${payload[item.key]}` : '' }), {} as Record<string, string>) || {};

      const headers = { ...baseHeaders, ...staticHeaders, ...dynamicHeaders };
      console.debug('[HTTP TOOL] Final headers:', headers);

      try {
        const axiosConfig = buildAxiosConfig(config, payload, requestData, headers);
        console.debug('[HTTP TOOL] Axios configuration:', axiosConfig);

        const response = await axios(finalUrl, axiosConfig);
        console.debug('[HTTP TOOL] Raw response data:', response.data);

        let finalData = response.data;
        const maxTokens =
          ModelConfig[toolHandlerConfig?.modelName || AgentModelName.gpt_4o].maxTokens * 0.7;
        const totalTokens = countTokensEstimation({ text: JSON.stringify(finalData) });
        console.debug('[HTTP TOOL] Total tokens:', totalTokens, 'Max allowed:', maxTokens);

        if (totalTokens > maxTokens) {
          console.debug('[HTTP TOOL] Token limit exceeded. Splitting response into chunks...');
          const chunks = await splitTextIntoChunks({
            text: JSON.stringify(finalData),
            chunkSize: maxTokens
          });
          finalData = chunks[0];
          console.debug('[HTTP TOOL] Chunk size (tokens):', countTokensEstimation({ text: JSON.stringify(finalData) }));
        }

        return { data: finalData };
      } catch (err: any) {
        console.error('[HTTP TOOL] Request error:', err);
        console.error('[HTTP TOOL] Error details:', {
          url: finalUrl,
          method: config.method,
          headers,
          requestData,
          error: err.message,
          response: err.response?.data
        });
        return {
          data: `The HTTP tool has failed: ${err.message}. Status: ${err.response?.status}`
        };
      }
    };

/* =============================================================================
   TOOL PARSER
============================================================================= */

/**
 * Creates a parser function from the tool's JSON schema.
 * This function uses `createToolParser` to validate and transform the payload.
 */
export const createParser =
  (tool: HttpToolSchema, config: any) =>
    (payload: string) => {
      try {
        const schema = toJsonSchema(tool).parameters;
        return createToolParser(schema)(payload);
      } catch (err) {
        console.error('[HTTP TOOL] Parser error:', err);
        throw err;
      }
    };
