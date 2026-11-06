import { withRetry } from './retry';

export interface OutgoingMessage {
  id: string;
  to: string;
  text: string;
}

export interface MessageSender {
  send(message: OutgoingMessage): Promise<string>;
}

export type DeliveryStatus = 'sent' | 'failed';

export interface DeliveryRecord extends OutgoingMessage {
  status: DeliveryStatus;
  attempts: number;
  deliveryId?: string;
  error?: string;
  finishedAt: string;
}

export interface DeliveryStore {
  save(record: DeliveryRecord): Promise<void>;
  findById(id: string): Promise<DeliveryRecord | undefined>;
}

export interface FailureAlerts {
  notifyFailure(messageId: string, reason: string): Promise<void>;
}

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 2000;

type SendOutcome =
  | { status: 'sent'; attempts: number; deliveryId: string }
  | { status: 'failed'; attempts: number; error: string };

export class MessageQueue {
  constructor(
    private sender: MessageSender,
    private store: DeliveryStore,
    private alerts: FailureAlerts,
  ) {}

  async dispatch(message: OutgoingMessage): Promise<DeliveryRecord> {
    if (!message.to.includes('@') || message.text.trim() === '') {
      throw new Error('INVALID_MESSAGE');
    }
    const outcome = await this.trySend(message);
    const record: DeliveryRecord = {
      ...message,
      ...outcome,
      finishedAt: new Date().toISOString(),
    };
    await this.store.save(record);
    if (outcome.status === 'failed') {
      await this.alerts.notifyFailure(message.id, outcome.error);
    }
    return record;
  }

  private async trySend(message: OutgoingMessage): Promise<SendOutcome> {
    let attempts = 0;
    try {
      const deliveryId = await withRetry(
        () => {
          attempts += 1;
          return this.sender.send(message);
        },
        MAX_ATTEMPTS,
        RETRY_DELAY_MS,
      );
      return { status: 'sent', attempts, deliveryId };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      return { status: 'failed', attempts, error: reason };
    }
  }
}