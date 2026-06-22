import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import * as bcrypt from 'bcryptjs';
import cookieParser = require('cookie-parser');

describe('API Flow (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let globalAdminCookie: string[];
  let globalUserCookie: string[];

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
    })
      .overrideProvider(CloudinaryService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue({
          public_id: 'folder/img1',
          secure_url: 'https://cloudinary.com/folder/img1.jpg',
        }),
        destroyFile: jest.fn().mockResolvedValue({ result: 'ok' }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser('token'));
    app.setGlobalPrefix('api');

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Login Admin
    jest
      .spyOn(prismaService.user, 'findUnique')
      .mockResolvedValue(mockAdminUser as any);
    jest
      .spyOn(prismaService.user, 'update')
      .mockResolvedValue(mockAdminUser as any);
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@mail.com', password: passwordPlain });
    globalAdminCookie = adminRes.headers['set-cookie'];

    // Login User
    jest
      .spyOn(prismaService.user, 'findUnique')
      .mockResolvedValue(mockNormalUser as any);
    jest
      .spyOn(prismaService.user, 'update')
      .mockResolvedValue(mockNormalUser as any);
    const userRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@mail.com', password: passwordPlain });
    globalUserCookie = userRes.headers['set-cookie'];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Endpoints', () => {
    it('POST /api/auth/register - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(mockNormalUser as any);

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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockAdminUser as any);

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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockAdminUser as any);

      const adminLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@mail.com', password: passwordPlain });
      adminCookie = adminLoginRes.headers['set-cookie'];

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockNormalUser as any);

      const userLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user@mail.com', password: passwordPlain });
      userCookie = userLoginRes.headers['set-cookie'];
    });

    it('GET /api/users/current - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);

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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.user, 'findMany')
        .mockResolvedValue([mockAdminUser, mockNormalUser] as any);
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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', userCookie)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('PATCH /api/users/current/profile - success', async () => {
      const updatedUser = { ...mockNormalUser, name: 'New Name' };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(updatedUser as any);

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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockNormalUser as any);

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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockNormalUser as any);

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
    let adminCookie: string[];
    let userCookie: string[];

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

    beforeAll(async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockAdminUser as any);

      const adminLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@mail.com', password: passwordPlain });
      adminCookie = adminLoginRes.headers['set-cookie'];

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockNormalUser as any);

      const userLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user@mail.com', password: passwordPlain });
      userCookie = userLoginRes.headers['set-cookie'];
    });

    it('POST /api/categories - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(prismaService.category, 'create')
        .mockResolvedValue(mockCategory);

      return request(app.getHttpServer())
        .post('/api/categories')
        .set('Cookie', adminCookie)
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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);

      return request(app.getHttpServer())
        .post('/api/categories')
        .set('Cookie', adminCookie)
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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue([mockCategory]);

      return request(app.getHttpServer())
        .get('/api/categories')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('GET /api/categories/:id - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);

      return request(app.getHttpServer())
        .get('/api/categories/10')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(10);
        });
    });

    it('PATCH /api/categories/:id - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(null);
      jest.spyOn(prismaService.category, 'update').mockResolvedValue({
        ...mockCategory,
        name: 'Updated Electronics',
      });

      return request(app.getHttpServer())
        .patch('/api/categories/10')
        .set('Cookie', adminCookie)
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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue({
        ...mockCategory,
        children: [],
        products: [],
      } as any);
      jest
        .spyOn(prismaService.category, 'delete')
        .mockResolvedValue(mockCategory);

      return request(app.getHttpServer())
        .delete('/api/categories/10')
        .set('Cookie', adminCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Product Endpoints', () => {
    let adminCookie: string[];
    let userCookie: string[];

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
    beforeAll(async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockAdminUser as any);

      const adminLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@mail.com', password: passwordPlain });
      adminCookie = adminLoginRes.headers['set-cookie'];

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockNormalUser as any);

      const userLoginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user@mail.com', password: passwordPlain });
      userCookie = userLoginRes.headers['set-cookie'];
    });

    it('POST /api/products - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.product, 'create')
        .mockResolvedValue(mockProduct as any);

      return request(app.getHttpServer())
        .post('/api/products')
        .set('Cookie', adminCookie)
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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/products')
        .set('Cookie', adminCookie)
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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.product, 'findMany')
        .mockResolvedValue([mockProduct] as any);

      return request(app.getHttpServer())
        .get('/api/products')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('GET /api/products/:id - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct as any);

      return request(app.getHttpServer())
        .get('/api/products/20')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(20);
        });
    });

    it('PATCH /api/products/:id - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct as any);
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({
        ...mockProduct,
        name: 'Updated Flour',
      } as any);

      return request(app.getHttpServer())
        .patch('/api/products/20')
        .set('Cookie', adminCookie)
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
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct as any);
      jest
        .spyOn(prismaService.product, 'delete')
        .mockResolvedValue(mockProduct as any);

      return request(app.getHttpServer())
        .delete('/api/products/20')
        .set('Cookie', adminCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Order Endpoints', () => {
    let userCookie: string[];
    let adminCookie: string[];

    const mockProduct = {
      id: 1,
      categoryId: 1,
      name: 'Loaf of Bread',
      description: 'Fresh loaf',
      price: 25.0,
      type: 'REGULAR',
      stock: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockOrder = {
      id: 50,
      userId: 2,
      totalPrice: 50.0,
      status: 'PENDING',
      deliveryMethod: 'DELIVERY',
      paymentMethod: 'TRANSFER',
      createdAt: new Date(),
      updatedAt: new Date(),
      orderItems: [
        {
          id: 1,
          orderId: 50,
          productId: 1,
          quantity: 2,
          priceEach: 25.0,
          note: 'Fresh please',
          createdAt: new Date(),
          updatedAt: new Date(),
          product: mockProduct,
        },
      ],
      user: {
        id: 2,
        name: 'Normal User',
        email: 'user@mail.com',
      },
    };

    beforeAll(async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockNormalUser as any);
      const userRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user@mail.com', password: passwordPlain });
      userCookie = userRes.headers['set-cookie'];

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockAdminUser as any);
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@mail.com', password: passwordPlain });
      adminCookie = adminRes.headers['set-cookie'];
    });

    it('POST /api/orders - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct as any);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (cb: any) => cb(prismaService));
      jest
        .spyOn(prismaService.order, 'create')
        .mockResolvedValue({ id: 50 } as any);
      jest
        .spyOn(prismaService.orderItem, 'create')
        .mockResolvedValue({} as any);
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({} as any);
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder as any);

      return request(app.getHttpServer())
        .post('/api/orders')
        .set('Cookie', userCookie)
        .send({
          deliveryMethod: 'DELIVERY',
          paymentMethod: 'TRANSFER',
          items: [{ productId: 1, quantity: 2, note: 'Fresh please' }],
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(50);
        });
    });

    it('GET /api/orders - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.order, 'findMany')
        .mockResolvedValue([mockOrder] as any);

      return request(app.getHttpServer())
        .get('/api/orders')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('GET /api/orders/:id - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder as any);

      return request(app.getHttpServer())
        .get('/api/orders/50')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(50);
        });
    });

    it('PATCH /api/orders/:id - user cancel success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValueOnce(mockOrder as any)
        .mockResolvedValueOnce({ ...mockOrder, status: 'CANCELED' } as any);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (cb: any) => cb(prismaService));
      jest.spyOn(prismaService.product, 'update').mockResolvedValue({} as any);
      jest
        .spyOn(prismaService.order, 'update')
        .mockResolvedValue({ ...mockOrder, status: 'CANCELED' } as any);

      return request(app.getHttpServer())
        .patch('/api/orders/50')
        .set('Cookie', userCookie)
        .send({ status: 'CANCELED' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('CANCELED');
        });
    });

    it('DELETE /api/orders/:id - fail as user', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .delete('/api/orders/50')
        .set('Cookie', userCookie)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('DELETE /api/orders/:id - success as admin', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.order, 'findUnique')
        .mockResolvedValue(mockOrder as any);
      jest
        .spyOn(prismaService.order, 'delete')
        .mockResolvedValue(mockOrder as any);

      return request(app.getHttpServer())
        .delete('/api/orders/50')
        .set('Cookie', adminCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Image Endpoints', () => {
    let adminCookie: string[];
    let userCookie: string[];

    const mockImage = {
      id: 100,
      productId: 1,
      publicId: 'folder/img1',
      urls: 'https://cloudinary.com/folder/img1.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProduct = {
      id: 1,
      categoryId: 1,
      name: 'Product A',
      description: 'Desc',
      price: 10.0,
      type: 'REGULAR',
      stock: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeAll(async () => {
      // Login Admin
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockAdminUser as any);
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@mail.com', password: passwordPlain });
      adminCookie = adminRes.headers['set-cookie'];

      // Login User
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockNormalUser as any);
      const userRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user@mail.com', password: passwordPlain });
      userCookie = userRes.headers['set-cookie'];
    });

    it('POST /api/images - fail as user', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .post('/api/images')
        .set('Cookie', userCookie)
        .attach('image', Buffer.from('mock file'), 'test.jpg')
        .field('productId', 1)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('POST /api/images - fail with no file', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct as any);

      return request(app.getHttpServer())
        .post('/api/images')
        .set('Cookie', adminCookie)
        .field('productId', 1)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('POST /api/images - success upload single image as admin', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.product, 'findUnique')
        .mockResolvedValue(mockProduct as any);
      jest.spyOn(prismaService.image, 'create').mockResolvedValue(mockImage);

      return request(app.getHttpServer())
        .post('/api/images')
        .set('Cookie', adminCookie)
        .attach('image', Buffer.from('mock file'), 'test.jpg')
        .field('productId', 1)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].id).toBe(100);
        });
    });

    it('GET /api/images - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.image, 'findMany')
        .mockResolvedValue([mockImage]);

      return request(app.getHttpServer())
        .get('/api/images')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('GET /api/images/:id - success', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockNormalUser as any);
      jest
        .spyOn(prismaService.image, 'findUnique')
        .mockResolvedValue(mockImage);

      return request(app.getHttpServer())
        .get('/api/images/100')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(100);
        });
    });

    it('PATCH /api/images/:id - success as admin', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.image, 'findMany')
        .mockResolvedValue([mockImage]);
      jest.spyOn(prismaService.image, 'update').mockResolvedValue({
        ...mockImage,
        urls: 'https://cloudinary.com/folder/img1-updated.jpg',
      });

      return request(app.getHttpServer())
        .patch('/api/images/100')
        .set('Cookie', adminCookie)
        .attach('image', Buffer.from('updated file'), 'updated.jpg')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data[0].urls).toContain('updated');
        });
    });

    it('DELETE /api/images/:id - success as admin', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockAdminUser as any);
      jest
        .spyOn(prismaService.image, 'findMany')
        .mockResolvedValue([mockImage]);
      jest
        .spyOn(prismaService.image, 'deleteMany')
        .mockResolvedValue({ count: 1 });

      return request(app.getHttpServer())
        .delete('/api/images/100')
        .set('Cookie', adminCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Payment Endpoints', () => {
    let userCookie: string[];
    let adminCookie: string[];

    const mockOrder = {
      id: 50,
      userId: 2,
      totalPrice: 50.00,
      status: 'PENDING',
      deliveryMethod: 'DELIVERY',
      paymentMethod: 'TRANSFER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPayment = {
      id: 80,
      orderId: 50,
      userId: 2,
      transactionId: 'TX-99999',
      amount: 50.00,
      paymentMethod: 'TRANSFER',
      status: 'PENDING',
      paymentProof: null,
      metadata: null,
      failureReason: null,
      refundAmount: null,
      refundedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: mockOrder,
      user: {
        id: 2,
        name: 'Normal User',
        email: 'user@mail.com',
      },
    };

    beforeAll(async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockNormalUser as any);
      const userRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'user@mail.com', password: passwordPlain });
      userCookie = userRes.headers['set-cookie'];

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(mockAdminUser as any);
      const adminRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@mail.com', password: passwordPlain });
      adminCookie = adminRes.headers['set-cookie'];
    });

    it('POST /api/payments - success', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.payment, 'create').mockResolvedValue(mockPayment as any);

      return request(app.getHttpServer())
        .post('/api/payments')
        .set('Cookie', userCookie)
        .send({
          orderId: 50,
          transactionId: 'TX-99999',
          amount: 50.00,
          paymentMethod: 'TRANSFER',
        })
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(80);
        });
    });

    it('GET /api/payments - success as user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.payment, 'findMany').mockResolvedValue([mockPayment] as any);

      return request(app.getHttpServer())
        .get('/api/payments')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('GET /api/payments/:id - success as owner', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPayment as any);

      return request(app.getHttpServer())
        .get('/api/payments/80')
        .set('Cookie', userCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(80);
        });
    });

    it('GET /api/payments/:id - fail as non-owner user', async () => {
      // Mock user is normal user with id 2. Let's make payment belong to userId 3.
      const otherPayment = { ...mockPayment, userId: 3 };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(otherPayment as any);

      return request(app.getHttpServer())
        .get('/api/payments/80')
        .set('Cookie', userCookie)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('PATCH /api/payments/:id - fail as user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .patch('/api/payments/80')
        .set('Cookie', userCookie)
        .send({ status: 'SETTLEMENT' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('PATCH /api/payments/:id - success as admin', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPayment as any);
      jest.spyOn(prismaService.payment, 'update').mockResolvedValue({ ...mockPayment, status: 'SETTLEMENT' } as any);

      return request(app.getHttpServer())
        .patch('/api/payments/80')
        .set('Cookie', adminCookie)
        .send({ status: 'SETTLEMENT' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('SETTLEMENT');
        });
    });

    it('DELETE /api/payments/:id - fail as user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockNormalUser as any);

      return request(app.getHttpServer())
        .delete('/api/payments/80')
        .set('Cookie', userCookie)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('DELETE /api/payments/:id - success as admin', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAdminUser as any);
      jest.spyOn(prismaService.payment, 'findUnique').mockResolvedValue(mockPayment as any);
      jest.spyOn(prismaService.payment, 'delete').mockResolvedValue(mockPayment as any);

      return request(app.getHttpServer())
        .delete('/api/payments/80')
        .set('Cookie', adminCookie)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});
