import { http, HttpResponse } from 'msw';
import usersJson from './fixtures/users.json';
import productsJson from './fixtures/products.json';
import { User } from '../app/features/users/user';
import { Product } from '../app/features/products/product';
import { setupWorker } from 'msw/browser';

let users: User[] = [...usersJson];
const products: Product[] = productsJson.map(p => ({
  id: p.id,
  title: p.title,
  description: p.description,
  price: p.price,
  category: 'Electronics',
  image: p.imageUrl,
  rating: { rate: 4.5, count: 100 },
}));

const mockOrders: { id: number; [key: string]: unknown }[] = [];

let nextOrderId = 1;

export const handlers = [
  // --- Users ---
  http.get('/api/users', () => {
    return HttpResponse.json(users);
  }),

  http.get('/api/users/:id', ({ params }) => {
    const user = users.find(u => u.id === Number(params['id']));
    return user ? HttpResponse.json(user) : new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/users', async ({ request }) => {
    const userData = (await request.json()) as User;
    const maxId = users.reduce((m, u) => Math.max(m, u.id), 0);

    const created = { ...userData, id: maxId + 1 };
    users.push(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put('/api/users/:id', async ({ request, params }) => {
    const updated = (await request.json()) as User;
    const id = Number(params['id']);

    users = users.map(u => (u.id === id ? updated : u));

    return HttpResponse.json(updated);
  }),

  http.delete('/api/users', async ({ request }) => {
    const ids = (await request.json()) as number[];
    users = users.filter(u => !ids.includes(u.id));

    return new HttpResponse(null, { status: 204 });
  }),

  // --- Products ---
  http.get('/api/products', () => {
    return HttpResponse.json(products);
  }),

  http.get('/api/products/:id', ({ params }) => {
    const product = products.find(p => p.id === Number(params['id']));
    return product ? HttpResponse.json(product) : new HttpResponse(null, { status: 404 });
  }),

  // --- Product Reviews ---
  http.get('/api/products/:id/reviews', () => {
    return HttpResponse.json([]);
  }),

  http.post('/api/products/:id/reviews', async ({ request }) => {
    const reviewData = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...reviewData, id: Date.now() }, { status: 201 });
  }),

  // --- Orders ---
  http.post('/api/orders', async ({ request }) => {
    const orderData = (await request.json()) as Record<string, unknown>;
    const order = { ...orderData, id: nextOrderId++ };
    mockOrders.push(order);
    return HttpResponse.json(order, { status: 201 });
  }),

  http.get('/api/orders', () => {
    return HttpResponse.json(mockOrders);
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const order = mockOrders.find(o => o.id === Number(params['id']));
    return order ? HttpResponse.json(order) : new HttpResponse(null, { status: 404 });
  }),

  // --- Auth ---
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    if (username === 'admin' && password === 'password') {
      return HttpResponse.json({
        token: 'mock-jwt-admin-token',
        username: 'admin',
        email: 'admin@shop.com',
      });
    }

    // For any other customer login, return a valid token
    return HttpResponse.json({
      token: `mock-jwt-${username}-token`,
      username,
      email: `${username}@shop.com`,
    });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    const { username, email, password } = body as {
      username: string;
      email: string;
      password: string;
    };

    if (!username || !password || !email) {
      return new HttpResponse(null, { status: 400 });
    }

    return HttpResponse.json({
      token: `mock-jwt-${username}-token`,
      username,
      email,
    });
  }),
];

export const worker = setupWorker(...handlers);
