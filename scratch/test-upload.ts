import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log('--- Starting Real Data Image Upload Test ---');

  // 1. Check/Create Admin User
  let admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });


  const hashedPassword = bcrypt.hashSync('Password123', 10);
  if (!admin) {
    console.log('No Admin user found in DB. Creating one...');
    admin = await prisma.user.create({
      data: {
        name: 'Admin Test',
        email: 'admin_test@mail.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
  } else {
    console.log('Admin user found. Updating password to ensure match...');
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });
  }
  console.log(`Using Admin: ${admin.email}`);

  // 2. Check/Create Product
  let product = await prisma.product.findFirst();
  if (!product) {
    console.log('No product found in DB. Creating a test product...');
    // Find or create category first
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Test Category',
          description: 'Category for testing',
        },
      });
    }
    product = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: 'Test Bakery Product',
        description: 'Delicious bakery item',
        price: 25.50,
        type: 'REGULAR',
        stock: 50,
      },
    });
  }
  console.log(`Using Product ID: ${product.id} (${product.name})`);

  // 3. Login to get Access Token
  console.log('Logging in as Admin to obtain access token...');
  const loginRes = await fetch('http://localhost:4015/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: admin.email,
      password: 'Password123',
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }

  const cookies = loginRes.headers.get('set-cookie');
  console.log('Login successful! Cookies retrieved.');

  // 4. Read the uploaded image files
  const imageFiles = [
    'media__1781863080352.jpg',
    'media__1781863080393.jpg',
    'media__1781863080491.jpg',
    'media__1781863080561.jpg',
    'media__1781863080570.jpg'
  ];

  const formData = new FormData();
  formData.append('productId', String(product.id));

  for (let i = 0; i < imageFiles.length; i++) {
    const filePath = `C:\\Users\\benny\\.gemini\\antigravity-ide\\brain\\fd3675b0-35f0-4e08-871b-37abb9d72aba\\${imageFiles[i]}`;
    if (!fs.existsSync(filePath)) {
      throw new Error(`Source image not found at ${filePath}`);
    }
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('images', fileBlob, `gpu_${i}.jpg`);
  }

  // 5. Send POST multipart request to upload image
  console.log('Uploading multiple images to /api/images...');
  const headers: HeadersInit = {};
  if (cookies) {
    headers['Cookie'] = cookies;
  }

  const uploadRes = await fetch('http://localhost:4015/api/images', {
    method: 'POST',
    headers,
    body: formData,
  });

  const uploadResult = await uploadRes.json();
  console.log('Upload HTTP Response:', JSON.stringify(uploadResult, null, 2));

  if (!uploadRes.ok) {
    throw new Error('Upload request failed.');
  }

  console.log('\n--- Test Passed Successfully! ---');
}

run()
  .catch((err) => {
    console.error('Test script encountered an error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
