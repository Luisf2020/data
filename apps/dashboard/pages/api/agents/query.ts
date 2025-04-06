import { NextApiResponse } from 'next';
import { z } from 'zod';

import ChatModel from '@chaindesk/lib/chat-model';
import { ModelConfig } from '@chaindesk/lib/config';
import {
  createAuthApiHandler,
  respond,
} from '@chaindesk/lib/createa-api-handler';
import streamData from '@chaindesk/lib/stream-data';
import { AppNextApiRequest, SSE_EVENT } from '@chaindesk/lib/types';
const handler = createAuthApiHandler();

type ChatResponse =
  | {
    answer: any;
    usage: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
    completion: any;
  }
  | {
    answer: string;
    usage: {
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    };
    completion?: undefined;
  }
  | undefined;


export const query = async (req: AppNextApiRequest, res: NextApiResponse) => {
  const { action, content } = JSON.parse(req.body);
  const ctrl = new AbortController();

  const AGENT_PORTKEY = "test-chatsappai";
  const AGENT_MESSAGE_ID = "message-id-test-chatsappai";

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  req.socket.on('close', function () {
    ctrl.abort();
  });

  const model = new ChatModel(AGENT_PORTKEY, AGENT_MESSAGE_ID);

  const handleStream = (text: string, event: SSE_EVENT | undefined): any =>
    streamData({
      event: event || SSE_EVENT.answer,
      data: text,
      res,
    });

  const response: ChatResponse = await model.call({
    model: ModelConfig.gpt_4o.name,
    messages: [
      { role: 'system', content: action },
      { content, role: 'user' },
    ],
    handleStream,
    user: AGENT_PORTKEY
  }) ?? { answer: '', usage: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 }, completion: undefined };


  const answer = (response as any)?.answer;

  streamData({
    data: '[DONE]',
    res,
  });
  return { answer };
};

handler.post(respond(query));

export default handler;
