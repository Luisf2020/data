import cors from '@chaindesk/lib/middlewares/cors';
import pipe from '@chaindesk/lib/middlewares/pipe';
import {
  createAuthApiHandler,
  respond,
} from '@chaindesk/lib/createa-api-handler';
import validate from '@chaindesk/lib/validate';
import { AppNextApiRequest } from '@chaindesk/lib/types';
import { NextApiResponse } from 'next';
const handler = createAuthApiHandler();

export const getData = async (
  req: AppNextApiRequest,
  res: NextApiResponse
) => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');
  if (!response.ok) {
    return { error: 'Failed to fetch data from API' };
  }
  const data = await response.json();

  return { data }
}
handler.get(respond(getData));

export default pipe(cors({ methods: ['GET', 'POST', 'HEAD'] }), handler);