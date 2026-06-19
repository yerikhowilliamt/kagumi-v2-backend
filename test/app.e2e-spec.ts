import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import cookieParser = require('cookie-parser');

describe('API Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  const passwordPlain = 'Password123';
  const hashedPassword = bcrypt.hashSync(passwordPlain, 10);

  const mockAdminUser = {
    id: 1,
    name: 'Admin User',
    email: 'admin@mail.com',
    password: hashedPassword,
    phone: '+6281234567890',
    address: 'Admin Street',
    role: 'ADMIN',
    refreshToken: hashedPassword,
    emailVerified: new Date(),
    imageUrl: null,
    publicId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    accounts: [],
    orders: [],
    payments: [],
  };

  const mockNormalUser = {
    id: 2,
    name: 'Normal User',
    email: 'user@mail.com',
    password: hashedPassword,
    phone: '+6281234567891',
    address: 'User Street',
    role: 'USER',
    refreshToken: null,
    emailVerified: new Date(),
    imageUrl: null,
    publicId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    accounts: [],
    orders: [],
    payments: [],
  };

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
    await app.close();
  });

  describe('Auth Endpoints', () => {
    it('POST /api/auth/register - success', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Normal User',
          email: 'user@mail.com',
          password: passwordPlain,
          phone: '+6281234567891',
          address: 'User Street',
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(mockNormalUser.email);
        });
    });

    it('POST /api/auth/login - success', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockAdminUser as any);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@mail.com',
          password: passwordPlain,
        })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('User Endpoints', () => {
    let adminCookie: string[];
    let userCookie: string[];

    beforeAll(async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockAdminUser as any);

      const adminLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@mail.com', password: passwordPlain });
      adminCookie = adminLoginRes.headers['set-cookie'];

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockNormalUser as any);

      const userLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user@mail.com', password: passwordPlain });
      userCookie = userLoginRes.headers['set-cookie'];
    });

    it('GET /api/users/current - success', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser as any);

      return request(app.getHttpServer())
        .get('/api/users/current')
        .set('Cookie', adminCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(mockAdminUser.email);
        });
    });

    it('GET /api/users (ADMIN only) - success as Admin', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([mockAdminUser, mockNormalUser] as any);
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(2);

      return request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', adminCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(2);
        });
    });

    it('GET /api/users (ADMIN only) - fail as User', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', userCookie)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('PATCH /api/users/current/profile - success', async () => {
      const updatedUser = { ...mockNormalUser, name: 'New Name' };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updatedUser as any);

      return request(app.getHttpServer())
        .patch('/api/users/current/profile')
        .set('Cookie', userCookie)
        .send({ name: 'New Name' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('New Name');
        });
    });

    it('PATCH /api/users/current/password - success', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .patch('/api/users/current/password')
        .set('Cookie', userCookie)
        .send({
          currentPassword: passwordPlain,
          password: 'Newpassword123',
          confirmPassword: 'Newpassword123',
        })
        .expect(HttpStatus.OK);
    });

    it('DELETE /api/users/logout - success', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .delete('/api/users/logout')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.headers['set-cookie'][0]).toContain('access_token=;');
        });
    });
  });

  describe('Category Endpoints', () => {
    const mockCategory = {
      id: 10,
      name: 'Electronics',
      description: 'Electronic things',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
      products: [],
    };

    it('POST /api/categories - success', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.category, 'create').mockResolvedValue(mockCategory as any);

      return request(app.getHttpServer())
        .post('/api/categories')
        .send({
          name: 'Electronics',
          description: 'Electronic things',
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Electronics');
        });
    });

    it('POST /api/categories - fail (duplicate name)', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(mockCategory as any);

      return request(app.getHttpServer())
        .post('/api/categories')
        .send({
          name: 'Electronics',
          description: 'Electronic things',
        })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toBe('Category name already exists');
        });
    });

    it('GET /api/categories - success', async () => {
      jest.spyOn(prismaService.category, 'findMany').mockResolvedValue([mockCategory] as any);

      return request(app.getHttpServer())
        .get('/api/categories')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('GET /api/categories/:id - success', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(mockCategory as any);

      return request(app.getHttpServer())
        .get('/api/categories/10')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(10);
        });
    });

    it('PATCH /api/categories/:id - success', async () => {
      jest.spyOn(prismaService.category, 'findUnique')
        .mockResolvedValueOnce(mockCategory as any)
        .mockResolvedValueOnce(null);
      jest.spyOn(prismaService.category, 'update').mockResolvedValue({
        ...mockCategory,
        name: 'Updated Electronics',
      } as any);

      return request(app.getHttpServer())
        .patch('/api/categories/10')
        .send({
          name: 'Updated Electronics',
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Updated Electronics');
        });
    });

    it('DELETE /api/categories/:id - success', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue({
        ...mockCategory,
        children: [],
        products: [],
      } as any);
      jest.spyOn(prismaService.category, 'delete').mockResolvedValue(mockCategory as any);

      return request(app.getHttpServer())
        .delete('/api/categories/10')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Product Endpoints', () => {
    const mockCategory = {
      id: 5,
      name: 'Baking',
      description: 'Baking goods',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProduct = {
      id: 20,
      categoryId: 5,
      name: 'Premium Flour',
      description: 'Finest quality flour',
      price: 15.5,
      type: 'REGULAR',
      stock: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: mockCategory,
    };

    it('POST /api/products - success', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(mockCategory as any);
      jest.spyOn(prismaService.product, 'create').mockResolvedValue(mockProduct as any);

      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          categoryId: 5,
          name: 'Premium Flour',
          description: 'Finest quality flour',
          price: 15.5,
          type: 'REGULAR',
          stock: 100,
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Premium Flour');
        });
    });

    it('POST /api/products - fail (invalid category)', async () => {
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          categoryId: 999,
          name: 'Premium Flour',
          description: 'Finest quality flour',
          price: 15.5,
          type: 'REGULAR',
          stock: 100,
        })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('GET /api/products - success', async () => {
      jest.spyOn(prismaService.product, 'findMany').mockResolvedValue([mockProduct] as any);

      return request(app.getHttpServer())
        .get('/api/products')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('GET /api/products/:id - success', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(mockProduct as any);

      return request(app.getHttpServer())
        .get('/api/products/20')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(20);
        });
    });

    it('PATCH /api/products/:id - success', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(mockProduct as any);
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({
        ...mockProduct,
        name: 'Updated Flour',
      } as any);

      return request(app.getHttpServer())
        .patch('/api/products/20')
        .send({
          name: 'Updated Flour',
        })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Updated Flour');
        });
    });

    it('DELETE /api/products/:id - success', async () => {
      jest.spyOn(prismaService.product, 'findUnique').mockResolvedValue(mockProduct as any);
      jest.spyOn(prismaService.product, 'delete').mockResolvedValue(mockProduct as any);

      return request(app.getHttpServer())
        .delete('/api/products/20')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});
