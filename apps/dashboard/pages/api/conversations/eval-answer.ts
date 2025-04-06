import Cors from 'cors';
import { NextApiResponse } from 'next';
import { ApiError, ApiErrorType } from '@chaindesk/lib/api-error';
import { createLazyAuthHandler } from '@chaindesk/lib/createa-api-handler';
import runMiddleware from '@chaindesk/lib/run-middleware';
import { EvalAnswer } from '@chaindesk/lib/types/dtos';
import { AppNextApiRequest } from '@chaindesk/lib/types/index';
import { prisma } from '@chaindesk/prisma/client';
import Portkey from 'portkey-ai';

const handler = createLazyAuthHandler();

const cors = Cors({
  methods: ['POST', 'HEAD'],
});

// Crear una instancia singleton de Portkey
const portkey = new Portkey({
  apiKey: process.env.PORTKEY_API_KEY
});

export const evalAnswer = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  try {
    const data = req.body;

    // Validación básica
    if (!data.messageId || !data.eval || !['good', 'bad'].includes(data.eval)) {
      return res.status(400).json({
        error: 'Invalid input data',
        code: 'VALIDATION_ERROR'
      });
    }

    const message = await prisma.message.findUnique({
      where: {
        id: data.messageId,
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        code: 'MESSAGE_NOT_FOUND'
      });
    }

    // Actualizar el mensaje
    const updated = await prisma.message.update({
      where: {
        id: data.messageId,
      },
      data: {
        eval: data.eval,
      },
    });

    // Usar la instancia de Portkey para enviar feedback
    try {
      await portkey.feedback.create({
        traceID: data.messageId,
        value: data.eval === "good" ? 1 : -1,
        weight: 1,
        metadata: {
          source: 'api',
          messageId: data.messageId,
          visitorId: data.visitorId,
          conversationId: message.conversationId
        }
      });

      console.log('Portkey feedback sent successfully');
    } catch (portkeyError) {
      // Log el error pero no interrumpir el flujo
      console.error('Portkey feedback error:', portkeyError);
    }

    return res.status(200).json({
      ...updated,
      feedback_sent: true
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

handler.post(evalAnswer);

export default async function wrapper(
  req: AppNextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);
  return handler(req, res);
}