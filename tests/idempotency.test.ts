import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { login, makeOrderPayload } from './helpers';
import { expectSchema } from './schema';
import { orderSchema } from './schemas/order.schema';

describe('POST /orders з Idempotency-Key', () => {
  let app: ReturnType<typeof createApp>;
  let token: string;

  const post = (key: string | undefined, body: object, tok = token) => {
    const req = request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${tok}`);
    if (key !== undefined) req.set('Idempotency-Key', key);
    return req.send(body);
  };

  beforeEach(async () => {
    app = createApp();
    token = await login(app, 'bob@example.com');
  });

  it('перший запит: 201 і без заголовка Idempotency-Replayed', async () => {
    const res = await post('k-1', makeOrderPayload());
    expect(res.status).toBe(201);
    expect(res.headers['idempotency-replayed']).toBeUndefined();
    expectSchema(res.body, orderSchema);
  });

  it('повтор: 200, те саме тіло, Location і Replayed: true', async () => {
    const first = await post('k-1', makeOrderPayload());
    const second = await post('k-1', makeOrderPayload());

    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(second.headers.location).toBe(`/orders/${first.body.id}`);
    expect(second.headers['idempotency-replayed']).toBe('true');
    expectSchema(second.body, orderSchema);
  });

  it('три однакові запити створюють рівно одне замовлення', async () => {
    await post('k-1', makeOrderPayload());
    await post('k-1', makeOrderPayload());
    await post('k-1', makeOrderPayload());

    const list = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(1);
  });

  it('той самий ключ з іншим вмістом → 422 і нове замовлення не створено', async () => {
    await post('k-1', makeOrderPayload());
    const res = await post(
      'k-1',
      makeOrderPayload({ items: [{ sku: 'X', price: 1, qty: 1 }] }),
    );
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('IDEMPOTENCY_KEY_CONFLICT');

    const list = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(1);
  });

  it.each([
    { name: 'порожній', key: '' },
    { name: 'лише пробіли', key: '   ' },
    { name: 'довший за 64 символи', key: 'a'.repeat(65) },
  ])('некоректний ключ ($name) → 400', async ({ key }) => {
    const res = await post(key, makeOrderPayload());
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_IDEMPOTENCY_KEY');
  });

  it('ключ рівно 64 символи допустимий', async () => {
    const res = await post('a'.repeat(64), makeOrderPayload());
    expect(res.status).toBe(201);
  });

  it('без заголовка кожен запит створює нове замовлення', async () => {
    const a = await post(undefined, makeOrderPayload());
    const b = await post(undefined, makeOrderPayload());
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.id).not.toBe(b.body.id);
  });

  it('ключ одного користувача не повертає його замовлення іншому', async () => {
    const alice = await login(app, 'alice@example.com');
    const a = await post('shared', makeOrderPayload(), alice);
    const b = await post('shared', makeOrderPayload());

    expect(b.status).toBe(201);
    expect(b.body.id).not.toBe(a.body.id);
  });

  it.each([
    { name: 'без токена', header: undefined },
    { name: 'підроблений токен', header: 'Bearer fake' },
  ])('$name → 401 навіть з ключем', async ({ header }) => {
    const req = request(app).post('/orders').set('Idempotency-Key', 'k-1');
    if (header) req.set('Authorization', header);
    const res = await req.send(makeOrderPayload());
    expect(res.status).toBe(401);
  });

  it('після DELETE той самий ключ створює нове замовлення', async () => {
    const first = await post('k-1', makeOrderPayload());
    await request(app)
      .delete(`/orders/${first.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    const again = await post('k-1', makeOrderPayload());
    expect(again.status).toBe(201);
    expect(again.body.id).not.toBe(first.body.id);
  });

  it('невалідне тіло з ключем → 400, ключ не «спалюється»', async () => {
    const bad = await post('k-1', { items: [] });
    expect(bad.status).toBe(400);
    const ok = await post('k-1', makeOrderPayload());
    expect(ok.status).toBe(201);
  });
});