export interface WebhookBody {
  _id: string;
  resource: string;
  user_id: string;
  topic: string;
  application_id: string;
  attempts: number;
  sent: string;
  received: string;
}
