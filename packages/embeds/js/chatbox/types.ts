import { CustomContact } from '@chaindesk/lib/types';

export interface ChatsappAIFactory {
  initBubble: (props: {
    agentId: string;
    onMarkedAsResolved?(): any;
    contact?: CustomContact;
  }) => void;
}
