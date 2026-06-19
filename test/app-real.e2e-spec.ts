import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import cookieParser = require('cookie-parser');

describe('API Flow with Real Database (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  const timestamp = Date.now();
  const testEmail = `realuser_${timestamp}@mail.com`;
  const testPhone = `+628${(timestamp % 1000000000).toString().padStart(9, '0')}`;
  const testPassword = 'Password123';
  const updatedPassword = 'Newpassword123';
  const testCategoryName = `Real Cat_${timestamp}`;
  const updatedCategoryName = `Real Cat Updated_${timestamp}`;

  let userCookie: string[];
  let categoryId: number;
  let testUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser('token'));
    app.setGlobalPrefix('api');

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Cleanup database records created during testing
    try {
      if (categoryId) {
        await prismaService.category.delete({ where: { id: categoryId } }).catch(() => {});
      }
      if (testEmail) {
        await prismaService.user.delete({ where: { email: testEmail } }).catch(() => {});
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('POST /api/auth/register - success', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Real Test User',
          email: testEmail,
          password: testPassword,
          phone: testPhone,
          address: 'Real Street 123',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
      testUserId = res.body.data.id;
    });

    it('POST /api/auth/login - success', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
      userCookie = res.headers['set-cookie'];
    });
  });

  describe('User Operations Flow', () => {
    it('GET /api/users/current - success', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/current')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
    });

    it('PATCH /api/users/current/profile - success', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/users/current/profile')
        .set('Cookie', userCookie)
        .send({
          name: 'Real User Updated',
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Real User Updated');
    });

    it('PATCH /api/users/current/password - success', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/current/password')
        .set('Cookie', userCookie)
        .send({
          currentPassword: testPassword,
          password: updatedPassword,
          confirmPassword: updatedPassword,
        })
        .expect(HttpStatus.OK);
    });

    it('GET /api/users - ADMIN restriction check', async () => {
      // Should fail as USER
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', userCookie)
        .expect(HttpStatus.FORBIDDEN);

      // Directly update user to ADMIN role in DB
      await prismaService.user.update({
        where: { email: testEmail },
        data: { role: 'ADMIN' },
      });

      // Should now succeed as ADMIN
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Category Operations Flow', () => {
    it('POST /api/categories - success', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/categories')
        .send({
          name: testCategoryName,
          description: 'Testing categories with real DB',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testCategoryName);
      categoryId = res.body.data.id;
    });

    it('POST /api/categories - fail (duplicate name)', async () => {
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({
          name: testCategoryName,
          description: 'Duplicate testing',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('GET /api/categories - success', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/categories')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/categories/:id - success', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/categories/${categoryId}`)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(categoryId);
    });

    it('PATCH /api/categories/:id - success', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/categories/${categoryId}`)
        .send({
          name: updatedCategoryName,
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updatedCategoryName);
    });

    it('DELETE /api/categories/:id - success', async () => {
      await request(app.getHttpServer())
        .delete(`/api/categories/${categoryId}`)
        .expect(HttpStatus.OK);

      // Verify category no longer exists
      await request(app.getHttpServer())
        .get(`/api/categories/${categoryId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Cleanup and Logout', () => {
    it('DELETE /api/users/logout - success', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/logout')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK);
    });
  });
});
