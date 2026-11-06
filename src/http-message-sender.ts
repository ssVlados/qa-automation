import type { MessageSender, OutgoingMessage } from './message-queue';

export class HttpMessageSender implements MessageSender {
  constructor(private baseUrl: string) {}

  async send(message: OutgoingMessage): Promise<string> {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: message.to, text: message.text }),
    });
    if (!response.ok) throw new Error('SEND_FAILED');
    const data = await response.json();
    if (typeof data.id !== 'string') throw new Error('INVALID_RESPONSE_FORMAT');
    return data.id;
  }
}