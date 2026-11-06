import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MessageQueue } from '../src/message-queue';
import type {
  DeliveryStore,
  FailureAlerts,
  MessageSender,
} from '../src/message-queue';
import { InMemoryDeliveryStore } from './fakes/in-memory-delivery-store';

const message = { id: 'M-1', to: 'user@example.com', text: 'Вітаємо!' };

describe('MessageQueue', () => {
  let sender: MessageSender;
  let store: InMemoryDeliveryStore;
  let alerts: FailureAlerts;
  let queue: MessageQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T10:00:00.000Z'));
    sender = { send: vi.fn().mockResolvedValue('D-1') }; // stub
    store = new InMemoryDeliveryStore(); // fake
    alerts = { notifyFailure: vi.fn().mockResolvedValue(undefined) }; // spy
    queue = new MessageQueue(sender, store, alerts);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('надсилає з першої спроби й зберігає запис про доставку', async () => {
    const record = await queue.dispatch(message);

    expect(record).toMatchObject({
      status: 'sent',
      attempts: 1,
      deliveryId: 'D-1',
      finishedAt: '2026-03-15T10:00:00.000Z',
    });
    expect(await store.findById('M-1')).toEqual(record);
    expect(alerts.notifyFailure).not.toHaveBeenCalled();
  });

  it('повторює спробу рівно через 2 секунди', async () => {
    sender.send = vi
      .fn()
      .mockRejectedValueOnce(new Error('SMTP_DOWN'))
      .mockResolvedValueOnce('D-2');

    const promise = queue.dispatch(message);
    await vi.advanceTimersByTimeAsync(1999);
    expect(sender.send).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(sender.send).toHaveBeenCalledTimes(2);

    const record = await promise;
    expect(record).toMatchObject({
      status: 'sent',
      attempts: 2,
      deliveryId: 'D-2',
    });
  });

  it('успішна третя спроба: два збої, потім доставка', async () => {
    sender.send = vi
      .fn()
      .mockRejectedValueOnce(new Error('TIMEOUT'))
      .mockRejectedValueOnce(new Error('TIMEOUT'))
      .mockResolvedValueOnce('D-3');

    const promise = queue.dispatch(message);
    await vi.advanceTimersByTimeAsync(4000);

    const record = await promise;
    expect(record).toMatchObject({ status: 'sent', attempts: 3 });
    expect(alerts.notifyFailure).not.toHaveBeenCalled();
  });

  it('після трьох невдач позначає запис failed і не робить четвертої спроби', async () => {
    sender.send = vi.fn().mockRejectedValue(new Error('SMTP_DOWN'));

    const promise = queue.dispatch(message);
    await vi.advanceTimersByTimeAsync(10000);

    const record = await promise;
    expect(sender.send).toHaveBeenCalledTimes(3);
    expect(record).toMatchObject({
      status: 'failed',
      attempts: 3,
      error: 'SMTP_DOWN',
    });
    expect(await store.findById('M-1')).toEqual(record);
    // сповіщення не змінює стану системи, тому перевіряємо саму взаємодію
    expect(alerts.notifyFailure).toHaveBeenCalledTimes(1);
    expect(alerts.notifyFailure).toHaveBeenCalledWith('M-1', 'SMTP_DOWN');
  });

  it('позначає невідому причину збою, якщо відхилено не помилку', async () => {
    sender.send = vi.fn().mockRejectedValue('boom');

    const promise = queue.dispatch(message);
    await vi.advanceTimersByTimeAsync(4000);

    const record = await promise;
    expect(record.error).toBe('UNKNOWN_ERROR');
  });

  it.each([
    { to: 'not-an-email', text: 'Вітаємо!' },
    { to: 'user@example.com', text: '   ' },
  ])('відхиляє некоректне повідомлення: $to / "$text"', async (invalid) => {
    await expect(
      queue.dispatch({ id: 'M-2', ...invalid }),
    ).rejects.toThrow('INVALID_MESSAGE');
    expect(sender.send).not.toHaveBeenCalled();
    expect(store.size).toBe(0);
  });

  it('збій сховища не спричиняє повторного надсилання', async () => {
    const brokenStore: DeliveryStore = {
      save: vi.fn().mockRejectedValue(new Error('STORE_UNAVAILABLE')),
      findById: vi.fn(),
    };
    const brokenQueue = new MessageQueue(sender, brokenStore, alerts);

    await expect(brokenQueue.dispatch(message)).rejects.toThrow(
      'STORE_UNAVAILABLE',
    );
    expect(sender.send).toHaveBeenCalledTimes(1);
  });

  it('збій сповіщення не втрачає запис про невдалу доставку', async () => {
    sender.send = vi.fn().mockRejectedValue(new Error('SMTP_DOWN'));
    alerts.notifyFailure = vi.fn().mockRejectedValue(new Error('ALERTS_DOWN'));

    const promise = queue.dispatch(message);
    const assertion = expect(promise).rejects.toThrow('ALERTS_DOWN');
    await vi.advanceTimersByTimeAsync(4000);

    await assertion;
    expect((await store.findById('M-1'))?.status).toBe('failed');
  });
});