import app from '../lib/app.js';
import supertest from 'supertest';
import client from '../lib/client.js';
import { execSync } from 'child_process';

const request = supertest(app);

describe('API Routes', () => {

  afterAll(async () => {
    return client.end();
  });

  describe('/api/cats', () => {

    let user;

    beforeAll(async () => {
      execSync('npm run recreate-tables');

      const response = await request
        .post('/api/auth/signup')
        .send({
          name: 'Me the User',
          email: 'me@user.com',
          password: 'password'
        });

      expect(response.status).toBe(200);

      user = response.body;
    });

    let felix = {
      id: expect.any(Number),
      name: 'Felix',
      type: 'Tuxedo',
      url: 'cats/felix.png',
      year: 1892,
      lives: 5,
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
      felix.userId = user.id;
      const response = await request
        .post('/api/cats')
        .send(felix);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(felix);
      
      // Update local client felix object
      felix = response.body;
    });

    it('PUT updated felix to /api/cats/:id', async () => {
      felix.lives = 2;
      felix.name = 'Mr. Felix';

      const response = await request
        .put(`/api/cats/${felix.id}`)
        .send(felix);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(felix);

    });

    it('GET list of cats from /api/cats', async () => {
      duchess.userId = user.id;
      const r1 = await request.post('/api/cats').send(duchess);
      duchess = r1.body;

      hobbs.userId = user.id;
      const r2 = await request.post('/api/cats').send(hobbs);
      hobbs = r2.body;

      const response = await request.get('/api/cats');

      expect(response.status).toBe(200);
      
      const expected = [felix, duchess, hobbs].map(cat => {
        return { 
          userName: user.name,
          ...cat 
        };
      });
      
      expect(response.body).toEqual(expect.arrayContaining(expected));
    });

    it('GET hobbs from /api/cats/:id', async () => {
      const response = await request.get(`/api/cats/${hobbs.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...hobbs, userName: user.name });
    });

    it('DELETE hobbs from /api/cats/:id', async () => {
      const response = await request.delete(`/api/cats/${hobbs.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(hobbs);

      const getResponse = await request.get('/api/cats');
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.find(cat => cat.id === hobbs.id)).toBeUndefined();

    });

  });  

  describe('seed data tests', () => {

    beforeAll(() => {
      execSync('npm run setup-db');
    });
  
    it('GET /api/cats', async () => {
      // act - make the request
      const response = await request.get('/api/cats');

      // was response OK (200)?
      expect(response.status).toBe(200);

      // did it return some data?
      expect(response.body.length).toBeGreaterThan(0);
      
      // did the data get inserted?
      expect(response.body[0]).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        type: expect.any(String),
        url: expect.any(String),
        year: expect.any(Number),
        lives: expect.any(Number),
        isSidekick: expect.any(Boolean),
        userId: expect.any(Number),
        userName: expect.any(String)
      });
    });

  });

});