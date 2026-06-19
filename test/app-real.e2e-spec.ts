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
  let productId: number;
  let orderId: number;

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
      if (orderId) {
        await prismaService.order.delete({ where: { id: orderId } }).catch(() => {});
      }
      if (productId) {
        await prismaService.product.delete({ where: { id: productId } }).catch(() => {});
      }
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
        .set('Cookie', userCookie)
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
        .set('Cookie', userCookie)
        .send({
          name: testCategoryName,
          description: 'Duplicate testing',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('GET /api/categories - success', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/categories/:id - success', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/categories/${categoryId}`)
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(categoryId);
    });

    it('PATCH /api/categories/:id - success', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/categories/${categoryId}`)
        .set('Cookie', userCookie)
        .send({
          name: updatedCategoryName,
        })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updatedCategoryName);
    });

    describe('Product Operations Flow', () => {
      it('POST /api/products - success', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/products')
          .set('Cookie', userCookie)
          .send({
            categoryId: categoryId,
            name: `Real Product_${timestamp}`,
            description: 'Testing product with real DB',
            price: 120.50,
            type: 'REGULAR',
            stock: 50,
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe(`Real Product_${timestamp}`);
        productId = res.body.data.id;
      });

      it('POST /api/products - fail (invalid category)', async () => {
        await request(app.getHttpServer())
          .post('/api/products')
          .set('Cookie', userCookie)
          .send({
            categoryId: 999999,
            name: 'Invalid Product',
            description: 'Fail creation',
            price: 10.0,
            type: 'REGULAR',
          })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('GET /api/products - success', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/products')
          .set('Cookie', userCookie)
          .expect(HttpStatus.OK);

        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
      });

      it('GET /api/products/:id - success', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/products/${productId}`)
          .set('Cookie', userCookie)
          .expect(HttpStatus.OK);

        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(productId);
      });

      it('PATCH /api/products/:id - success', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/api/products/${productId}`)
          .set('Cookie', userCookie)
          .send({
            name: `Real Product Updated_${timestamp}`,
            price: 150.00,
            stock: 40,
          })
          .expect(HttpStatus.OK);

        expect(res.body.data.name).toBe(`Real Product Updated_${timestamp}`);
        expect(parseFloat(res.body.data.price)).toBe(150.00);
      });

      describe('Order Operations Flow', () => {
        it('POST /api/orders - success', async () => {
          await prismaService.user.update({
            where: { email: testEmail },
            data: { role: 'USER' },
          });

          const res = await request(app.getHttpServer())
            .post('/api/orders')
            .set('Cookie', userCookie)
            .send({
              deliveryMethod: 'DELIVERY',
              paymentMethod: 'TRANSFER',
              items: [{ productId: productId, quantity: 2, note: 'Real order' }],
            })
            .expect(HttpStatus.CREATED);

          expect(res.body.success).toBe(true);
          expect(res.body.data.userId).toBe(testUserId);
          orderId = res.body.data.id;
        });

        it('GET /api/categories - success as USER', async () => {
          await request(app.getHttpServer())
            .get('/api/categories')
            .set('Cookie', userCookie)
            .expect(HttpStatus.OK);
        });

        it('POST /api/categories - forbidden as USER', async () => {
          await request(app.getHttpServer())
            .post('/api/categories')
            .set('Cookie', userCookie)
            .send({
              name: 'Invalid Category By User',
              description: 'Should fail',
            })
            .expect(HttpStatus.FORBIDDEN);
        });

        it('GET /api/orders - success', async () => {
          const res = await request(app.getHttpServer())
            .get('/api/orders')
            .set('Cookie', userCookie)
            .expect(HttpStatus.OK);

          expect(res.body.success).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('GET /api/orders/:id - success', async () => {
          const res = await request(app.getHttpServer())
            .get(`/api/orders/${orderId}`)
            .set('Cookie', userCookie)
            .expect(HttpStatus.OK);

          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(orderId);
        });

        it('PATCH /api/orders/:id - success (cancel)', async () => {
          const res = await request(app.getHttpServer())
            .patch(`/api/orders/${orderId}`)
            .set('Cookie', userCookie)
            .send({ status: 'CANCELED' })
            .expect(HttpStatus.OK);

          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('CANCELED');
        });

        it('DELETE /api/orders/:id - success (as ADMIN)', async () => {
          await prismaService.user.update({
            where: { email: testEmail },
            data: { role: 'ADMIN' },
          });

          await request(app.getHttpServer())
            .delete(`/api/orders/${orderId}`)
            .set('Cookie', userCookie)
            .expect(HttpStatus.OK);

          // Verify order no longer exists
          await request(app.getHttpServer())
            .get(`/api/orders/${orderId}`)
            .set('Cookie', userCookie)
            .expect(HttpStatus.NOT_FOUND);

          orderId = null;
        });
      });

      it('DELETE /api/products/:id - success', async () => {
        await request(app.getHttpServer())
          .delete(`/api/products/${productId}`)
          .set('Cookie', userCookie)
          .expect(HttpStatus.OK);

        // Verify product no longer exists
        await request(app.getHttpServer())
          .get(`/api/products/${productId}`)
          .set('Cookie', userCookie)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    it('DELETE /api/categories/:id - success', async () => {
      await request(app.getHttpServer())
        .delete(`/api/categories/${categoryId}`)
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK);

      // Verify category no longer exists
      await request(app.getHttpServer())
        .get(`/api/categories/${categoryId}`)
        .set('Cookie', userCookie)
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
