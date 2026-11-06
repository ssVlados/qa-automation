import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const RATE_URL = 'https://api.example.com/rate';
export const MAIL_URL = 'https://mail.example.com/send';

export const handlers = [
  http.get(RATE_URL, () => HttpResponse.json({ rate: 41.25 })),
  http.post(MAIL_URL, () => HttpResponse.json({ id: 'D-100' })),
];

export const server = setupServer(...handlers);