import { http, HttpResponse } from 'msw';
import productsJson from './fixtures/products.json';
import { Product } from '../app/features/products/product';
import { User, FakeStoreUser } from '../app/features/users/user';
import { setupWorker } from 'msw/browser';

let fakeUsers: FakeStoreUser[] = [
  {
    id: 1,
    email: 'john@gmail.com',
    username: 'johnd',
    password: 'm38rmF$',
    name: { firstname: 'john', lastname: 'doe' },
    phone: '1-570-236-7033',
    address: {
      geolocation: { lat: '-37.3159', long: '81.1496' },
      city: 'kilcoole',
      street: 'new road',
      number: 7682,
      zipcode: '12926-3874',
    },
    __v: 0,
  },
  {
    id: 2,
    email: 'morrison@gmail.com',
    username: 'mor_2314',
    password: '83r5^_',
    name: { firstname: 'david', lastname: 'morrison' },
    phone: '1-570-236-7033',
    address: {
      geolocation: { lat: '-37.3159', long: '81.1496' },
      city: 'kilcoole',
      street: 'Lovers Ln',
      number: 7267,
      zipcode: '12926-3874',
    },
    __v: 0,
  },
  {
    id: 3,
    email: 'kevin@gmail.com',
    username: 'kevinryan',
    password: 'kev02937@',
    name: { firstname: 'kevin', lastname: 'ryan' },
    phone: '1-567-094-1345',
    address: {
      geolocation: { lat: '40.3467', long: '-30.1310' },
      city: 'Cullman',
      street: 'Frances Ct',
      number: 86,
      zipcode: '29567-1452',
    },
    __v: 0,
  },
  {
    id: 4,
    email: 'don@gmail.com',
    username: 'donero',
    password: 'ewedon',
    name: { firstname: 'don', lastname: 'romer' },
    phone: '1-765-789-6734',
    address: {
      geolocation: { lat: '50.3467', long: '-20.1310' },
      city: 'San Antonio',
      street: 'Hunters Creek Dr',
      number: 6454,
      zipcode: '98234-1734',
    },
    __v: 0,
  },
  {
    id: 5,
    email: 'derek@gmail.com',
    username: 'derek',
    password: 'jklg*_56',
    name: { firstname: 'derek', lastname: 'powell' },
    phone: '1-956-001-1945',
    address: {
      geolocation: { lat: '40.3467', long: '-40.1310' },
      city: 'san Antonio',
      street: 'adams St',
      number: 245,
      zipcode: '80796-1234',
    },
    __v: 0,
  },
  {
    id: 6,
    email: 'jacob@gmail.com',
    username: 'jacobw',
    password: 'jacob123',
    name: { firstname: 'jacob', lastname: 'Wilson' },
    phone: '1-555-111-2222',
    __v: 0,
  },
  {
    id: 7,
    email: 'joann@gmail.com',
    username: 'joannw',
    password: 'joann123',
    name: { firstname: 'joann', lastname: 'wilson' },
    phone: '1-555-333-4444',
    __v: 0,
  },
];

const products: Product[] = productsJson.map(p => ({
  id: p.id,
  title: p.title,
  description: p.description,
  price: p.price,
  category: 'Electronics',
  image: p.imageUrl,
  rating: { rate: 4.5, count: 100 },
}));

export const handlers = [
  // ── Fake Store API: Users ──────────────────────────────────────

  http.get('https://fakestoreapi.com/users', () => {
    return HttpResponse.json(fakeUsers);
  }),

  http.get('https://fakestoreapi.com/users/:id', ({ params }) => {
    const user = fakeUsers.find(u => u.id === Number(params['id']));
    return user ? HttpResponse.json(user) : new HttpResponse(null, { status: 404 });
  }),

  http.post('https://fakestoreapi.com/users', async ({ request }) => {
    const body = (await request.json()) as Partial<FakeStoreUser>;
    const maxId = fakeUsers.reduce((m, u) => Math.max(m, u.id), 0);

    const created: FakeStoreUser = {
      id: maxId + 1,
      email: body.email || '',
      username: body.username || '',
      password: body.password || '',
      name: body.name || { firstname: '', lastname: '' },
      phone: body.phone || '',
      __v: 0,
    };
    fakeUsers.push(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch('https://fakestoreapi.com/users/:id', async ({ request, params }) => {
    const body = (await request.json()) as Partial<FakeStoreUser>;
    const id = Number(params['id']);

    const index = fakeUsers.findIndex(u => u.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    fakeUsers[index] = { ...fakeUsers[index], ...body };
    return HttpResponse.json(fakeUsers[index]);
  }),

  http.delete('https://fakestoreapi.com/users/:id', ({ params }) => {
    const id = Number(params['id']);
    fakeUsers = fakeUsers.filter(u => u.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Fake Store API: Auth ───────────────────────────────────────

  http.post('https://fakestoreapi.com/auth/login', async ({ request }) => {
    const { username, password } = (await request.json()) as {
      username: string;
      password: string;
    };

    const user = fakeUsers.find(u => u.username === username && u.password === password);

    if (!user) {
      return new HttpResponse('Invalid username or password', { status: 401 });
    }

    return HttpResponse.json({
      accessToken: `fake_jwt_${user.id}`,
      userId: user.id,
    });
  }),

  http.post('https://fakestoreapi.com/auth/register', async ({ request }) => {
    const body = (await request.json()) as Partial<FakeStoreUser>;

    const exists = fakeUsers.find(u => u.username === body.username);
    if (exists) {
      return new HttpResponse('Username already exists', { status: 409 });
    }

    const maxId = fakeUsers.reduce((m, u) => Math.max(m, u.id), 0);
    const created: FakeStoreUser = {
      id: maxId + 1,
      email: body.email || '',
      username: body.username || '',
      password: body.password || '',
      name: body.name || { firstname: '', lastname: '' },
      phone: body.phone || '',
      __v: 0,
    };
    fakeUsers.push(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  // ── Fake Store API: Products ───────────────────────────────────

  http.get('https://fakestoreapi.com/products', () => {
    return HttpResponse.json(products);
  }),

  http.get('https://fakestoreapi.com/products/:id', ({ params }) => {
    const product = products.find(p => p.id === Number(params['id']));
    return product ? HttpResponse.json(product) : new HttpResponse(null, { status: 404 });
  }),

  // ── Legacy local API (for admin CRUD still using old endpoints) ──

  http.get('/api/customers', () => {
    const customers = fakeUsers.map(u => ({
      id: u.id,
      firstName: u.name.firstname,
      lastName: u.name.lastname,
      email: u.email,
      isActive: true,
      phoneNumber: u.phone,
    }));
    return HttpResponse.json(customers);
  }),

  http.get('/api/users', () => {
    return HttpResponse.json(fakeUsers);
  }),

  http.post('/api/users', async ({ request }) => {
    const user = (await request.json()) as User;
    const maxId = fakeUsers.reduce((m, u) => Math.max(m, u.id), 0);

    const created: FakeStoreUser = {
      id: maxId + 1,
      email: user.email,
      username: user.email.split('@')[0],
      password: 'password123',
      name: { firstname: user.firstName, lastname: user.lastName },
      phone: user.phoneNumber,
      __v: 0,
    };
    fakeUsers.push(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put('/api/users/:id', async ({ request, params }) => {
    const updated = (await request.json()) as User;
    const id = Number(params['id']);

    const index = fakeUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      fakeUsers[index] = {
        ...fakeUsers[index],
        email: updated.email,
        name: { firstname: updated.firstName, lastname: updated.lastName },
        phone: updated.phoneNumber,
      };
    }

    return HttpResponse.json(updated);
  }),

  http.delete('/api/users', async ({ request }) => {
    const ids = (await request.json()) as number[];
    fakeUsers = fakeUsers.filter(u => !ids.includes(u.id));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/products', () => {
    return HttpResponse.json(products);
  }),

  http.get('/api/products/:id', ({ params }) => {
    const product = products.find(p => p.id === Number(params['id']));
    return product ? HttpResponse.json(product) : new HttpResponse(null, { status: 404 });
  }),
];

export const worker = setupWorker(...handlers);
