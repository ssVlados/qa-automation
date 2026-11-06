import type { DeliveryRecord, DeliveryStore } from '../../src/message-queue';

export class InMemoryDeliveryStore implements DeliveryStore {
  private items = new Map<string, DeliveryRecord>();

  async save(record: DeliveryRecord): Promise<void> {
    this.items.set(record.id, record);
  }

  async findById(id: string): Promise<DeliveryRecord | undefined> {
    return this.items.get(id);
  }

  get size(): number {
    return this.items.size;
  }
}