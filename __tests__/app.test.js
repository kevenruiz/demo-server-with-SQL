import app from '../lib/app.js';
import supertest from 'supertest';
import client from '../lib/client.js';
import { execSync } from 'child_process';

const request = supertest(app);

describe('API Routes', () => {

  // close the db connection when tests are ALL complete
  afterAll(async () => {
    return client.end();
  });

  beforeAll(() => {
    execSync('npm run recreate-tables');
  });

  describe('/api/cats CRUD', () => {

    let felix = {
      id: expect.any(Number),
      name: 'Felix',
      type: 'Tuxedo',
      url: 'cats/felix.png',
      year: 1892,
      lives: 3,
      isSidekick: false
    };

    let duchess = {
      id: expect.any(Number),
      name: 'Duchess',
      type: 'Angora',
      url: 'cats/duchess.jpeg',
      year: 1970,
      lives: 9,
      isSidekick: false
    };

    let hobbs = {
      id: expect.any(Number),
      name: 'Hobbs',
      type: 'Orange Tabby',
      url: 'cats/hobbs.jpeg',
      year: 1985,
      lives: 6,
      isSidekick: true
    };

    it('POST felix to /api/cats', async () => {
      const response = await request
        .post('/api/cats')
        .send(felix);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(felix);

      felix = response.body;
    });

    it('PUT updated felix to /api/cats/:id', async () => {
      felix.lives = 2;

      const response = await request
        .put(`/api/cats/${felix.id}`)
        .send(felix);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(felix);
    });

    it('GET list of cats from /api/cats', async () => {
      const r1 = await request.post('/api/cats').send(duchess);
      duchess = r1.body;
      const r2 = await request.post('/api/cats').send(hobbs);
      hobbs = r2.body;

      const response = await request.get('/api/cats');
      const cats = response.body;

      expect(response.status).toBe(200);
      expect(cats.length).toEqual(3);
      expect(cats).toEqual(expect.arrayContaining([felix, duchess, hobbs]));
    });

    it('GET cat from /api/cats/:id', async () => {
      const response = await request.get(`/api/cats/${hobbs.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(hobbs);
    });

    it('DELETE cat from /api/cats/:id', async () => {
      const response = await request.del(`/api/cats/${hobbs.id}`);
      expect(response.status).toBe(200);

      const getReponse = await request.get('/api/cats');
      const cats = getReponse.body;

      expect(response.status).toBe(200);
      expect(cats.length).toEqual(2);
      expect(cats).toEqual(expect.arrayContaining([felix, duchess]));
    });

    it('GET with name query param to /api/cats finds cats', async () => {
      const response = await request.get('/api/cats?name=duch');
      const cats = response.body;

      expect(response.status).toBe(200);
      expect(cats).toEqual([duchess]);
    });

  });

  describe('seed data', () => {

    beforeAll(() => {
      execSync('npm run setup-db');
    });

    it('GET /api/cats returns seed data cats', async () => {
      const response = await request.get('/api/cats');
      expect(response.status).toBe(200);
      expect(response.body.length).toEqual(8);
    });

  });

});