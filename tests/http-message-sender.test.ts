import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, MAIL_URL } from './msw/server';
import { HttpMessageSender } from '../src/http-message-sender';

const sender = new HttpMessageSender('https://mail.example.com');
const message = { id: 'M-1', to: 'user@example.com', text: 'Вітаємо!' };

describe('HttpMessageSender', () => {
  it('повертає ідентифікатор доставки з успішної відповіді', async () => {
    await expect(sender.send(message)).resolves.toBe('D-100');
  });

  it('відхиляє відповідь зі статусом 503', async () => {
    server.use(
      http.post(MAIL_URL, () => new HttpResponse(null, { status: 503 })),
    );
    await expect(sender.send(message)).rejects.toThrow('SEND_FAILED');
  });

  it('відхиляє відповідь зі статусом 400', async () => {
    server.use(
      http.post(MAIL_URL, () => new HttpResponse(null, { status: 400 })),
    );
    await expect(sender.send(message)).rejects.toThrow('SEND_FAILED');
  });

  it('відхиляє ідентифікатор у вигляді числа', async () => {
    server.use(http.post(MAIL_URL, () => HttpResponse.json({ id: 123 })));
    await expect(sender.send(message)).rejects.toThrow(
      'INVALID_RESPONSE_FORMAT',
    );
  });

  it('відхиляє відповідь, що не є JSON', async () => {
    server.use(http.post(MAIL_URL, () => new HttpResponse('not json')));
    await expect(sender.send(message)).rejects.toThrow();
  });

  it('надсилає POST із адресатом і текстом у тілі запиту', async () => {
    let method: string | undefined;
    let body: unknown;
    server.use(
      http.post(MAIL_URL, async ({ request }) => {
        method = request.method;
        body = await request.json();
        return HttpResponse.json({ id: 'D-1' });
      }),
    );
    await sender.send(message);
    expect(method).toBe('POST');
    expect(body).toEqual({ to: 'user@example.com', text: 'Вітаємо!' });
  });

  it('опрацьовує мережеву помилку', async () => {
    server.use(http.post(MAIL_URL, () => HttpResponse.error()));
    await expect(sender.send(message)).rejects.toThrow();
  });
});