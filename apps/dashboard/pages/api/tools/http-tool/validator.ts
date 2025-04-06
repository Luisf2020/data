import axios from 'axios';
import { NextApiResponse } from 'next';
import z, { any } from 'zod';

import {
  createAuthApiHandler,
  respond,
} from '@chaindesk/lib/createa-api-handler';
import { AppNextApiRequest } from '@chaindesk/lib/types';

const handler = createAuthApiHandler();

const bodySchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
    z.record(z.string(), z.unknown())
  ])).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
});


const tryParseJSON = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parseBodyValues = (payload: Record<string, any>) => {
  if (!payload) return {};

  // Función recursiva para parsear valores anidados
  const parseValue = (value: any): any => {
    // Si es null o undefined, retornarlo
    if (value === null || value === undefined) return value;

    // Si es string, intentar parsear
    if (typeof value === 'string') {
      // Limpiar espacios extra
      const trimmedValue = value.trim();

      // Si parece JSON, intentar parsearlo
      if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) ||
        (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
        const parsed = tryParseJSON(trimmedValue);
        // Si se parseó exitosamente y es un objeto/array, procesar sus valores recursivamente
        if (parsed !== trimmedValue) {
          return parseValue(parsed);
        }
      }

      // Booleanos
      if (trimmedValue.toLowerCase() === 'true') return true;
      if (trimmedValue.toLowerCase() === 'false') return false;

      // Números
      if (!isNaN(Number(trimmedValue)) && trimmedValue !== '') {
        return Number(trimmedValue);
      }

      // Si no se pudo parsear, retornar el string original
      return value;
    }

    // Si es array, parsear cada elemento recursivamente
    if (Array.isArray(value)) {
      return value.map(item => parseValue(item));
    }

    // Si es objeto, parsear cada valor recursivamente
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, parseValue(v)])
      );
    }

    return value;
  };

  // Parsear cada valor del payload
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, parseValue(value)])
  );
};



export const validateEndpoint = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  let testResult: any;
  try {
    const requestBody = bodySchema.parse(req.body);
    const url = requestBody.url;

    console.log(JSON.stringify(requestBody, null, 2))

    // Definir encabezados por defecto
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Combinar encabezados por defecto con los proporcionados en requestBody.headers
    const headers = {
      ...defaultHeaders, // Aplica los encabezados por defecto primero
      ...requestBody.headers, // Sobrescribe con los encabezados proporcionados si existen
    };

    const requestPayload = requestBody.body || {};

    console.log('Req body: ' + JSON.stringify(requestBody, null, 2));

    switch (requestBody.method) {
      case 'GET': {
        const response = await axios.get(url, { headers });
        testResult = { status: response.status, data: response.data };
        break;
      }
      case 'DELETE': {
        const response = await axios.delete(url, { headers });
        testResult = { status: response.status, data: response.data };
        break;
      }
      case 'PATCH': {
        const response = await axios.patch(url, requestPayload, { headers });
        testResult = { status: response.status, data: response.data };
        break;
      }
      case 'POST': {
        const parsedBody = parseBodyValues(requestPayload);
        const response = await axios.post(url, parsedBody, { headers });
        testResult = { status: response.status, data: response.data };
        break;
      }

      case 'PUT': {
        const response = await axios.put(url, requestPayload, { headers });
        testResult = {
          status: response.status,
          data: response.data,
        };
        break;
      }
    }
  } catch (e) {
    testResult = { status: 400, error: e };
  }

  console.log(JSON.stringify(testResult, null, 2));

  return testResult;
};

handler.post(respond(validateEndpoint));

export default handler;
