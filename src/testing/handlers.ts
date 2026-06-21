import { http, HttpResponse } from 'msw';
import customersJson from './fixtures/customers.json';
import productsJson from './fixtures/products.json';
import { Customer } from '../app/features/users/user';
import { Product } from '../app/features/products/product';
import { setupWorker } from 'msw/browser';

let customers: Customer[] = [...customersJson];
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
  http.get('/api/customers', () => {
    return HttpResponse.json(customers);
  }),

  http.get('/api/customers/:id', ({ params }) => {
    const customer = customers.find(c => c.id === Number(params['id']));
    return customer ? HttpResponse.json(customer) : new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/customers', async ({ request }) => {
    const customer = (await request.json()) as Customer;
    const maxId = customers.reduce((m, c) => Math.max(m, c.id), 0);

    const created = { ...customer, id: maxId + 1 };
    customers.push(created);

    return HttpResponse.json(created, { status: 201 });
  }),

  http.put('/api/customers/:id', async ({ request, params }) => {
    const updated = (await request.json()) as Customer;
    const id = Number(params['id']);

    customers = customers.map(c => (c.id === id ? updated : c));

    return HttpResponse.json(updated);
  }),

  http.delete('/api/customers', async ({ request }) => {
    const ids = (await request.json()) as number[];
    customers = customers.filter(c => !ids.includes(c.id));

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
