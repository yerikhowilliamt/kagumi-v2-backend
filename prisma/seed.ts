import { PrismaService } from '../src/common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaService();

async function main() {
  console.log('Sedang melakukan seeding database...');

  // 1. Create Super Admin
  const hashedPassword = await bcrypt.hash('Admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@mail.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@mail.com',
      password: hashedPassword,
      phone: '+6280000000000',
      address: 'Kagumi Bakery HQ, Jakarta',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 2. Create Categories
  const categories = [
    { name: 'Donat Reguler', description: 'Koleksi donat klasik yang cocok untuk teman ngopi harian Anda.' },
    { name: 'Donat Premium', description: 'Donat dengan racikan bahan premium dan topping eksklusif.' },
    { name: 'Kue Ulang Tahun', description: 'Kue spesial untuk merayakan momen berharga Anda.' },
    { name: 'Minuman', description: 'Pilihan kopi dan minuman segar pelepas dahaga.' },
  ];

  const createdCategories: any[] = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }
  console.log(`✅ Categories seeded: ${createdCategories.length}`);

  // 3. Create Products & Images
  const products = [
    // --- DONAT REGULER (5) ---
    {
      name: 'Classic Glazed Donut',
      description: 'Donat klasik dengan lapisan gula manis yang meleleh sempurna di mulut. Best seller kami sepanjang masa!',
      price: 12000,
      type: 'REGULAR' as const,
      stock: 100,
      categoryId: createdCategories.find((c) => c.name === 'Donat Reguler')!.id,
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Chocolate Sprinkle',
      description: 'Donat cokelat lezat berpadu dengan taburan meses premium yang renyah.',
      price: 15000,
      type: 'REGULAR' as const,
      stock: 80,
      categoryId: createdCategories.find((c) => c.name === 'Donat Reguler')!.id,
      image: 'https://images.unsplash.com/photo-1551024506-0cb0a114226d?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Strawberry Frosted',
      description: 'Donat berlapis icing strawberry asli yang manis dan sedikit asam yang menyegarkan.',
      price: 15000,
      type: 'REGULAR' as const,
      stock: 75,
      categoryId: createdCategories.find((c) => c.name === 'Donat Reguler')!.id,
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Sugar Cinnamon',
      description: 'Donat klasik berselimut gula bubuk dan kayu manis yang harum.',
      price: 12000,
      type: 'REGULAR' as const,
      stock: 90,
      categoryId: createdCategories.find((c) => c.name === 'Donat Reguler')!.id,
      image: 'https://images.unsplash.com/photo-1551024506-0cb0a114226d?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Vanilla Cream',
      description: 'Donat lembut dengan isian krim vanilla asli yang lumer di mulut.',
      price: 15000,
      type: 'REGULAR' as const,
      stock: 60,
      categoryId: createdCategories.find((c) => c.name === 'Donat Reguler')!.id,
      image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=600&auto=format&fit=crop',
    },

    // --- DONAT PREMIUM (5) ---
    {
      name: 'Matcha Premium',
      description: 'Bagi pecinta teh hijau! Donat lembut dibalut lelehan cokelat matcha impor dari Uji, Jepang.',
      price: 20000,
      type: 'REGULAR' as const,
      stock: 40,
      categoryId: createdCategories.find((c) => c.name === 'Donat Premium')!.id,
      image: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Tiramisu Bliss',
      description: 'Kelembutan donat yang disuntik dengan cream mascarpone dan ditaburi bubuk kakao premium.',
      price: 22000,
      type: 'REGULAR' as const,
      stock: 35,
      categoryId: createdCategories.find((c) => c.name === 'Donat Premium')!.id,
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Choco Almond',
      description: 'Balutan dark chocolate dengan taburan kacang almond panggang yang gurih.',
      price: 22000,
      type: 'REGULAR' as const,
      stock: 30,
      categoryId: createdCategories.find((c) => c.name === 'Donat Premium')!.id,
      image: 'https://images.unsplash.com/photo-1551024506-0cb0a114226d?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Caramel Pecan',
      description: 'Saus karamel legit berpadu kacang pecan utuh di atas donat premium kami.',
      price: 24000,
      type: 'REGULAR' as const,
      stock: 25,
      categoryId: createdCategories.find((c) => c.name === 'Donat Premium')!.id,
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Blueberry Cheese',
      description: 'Kombinasi cream cheese lumer dan selai blueberry buatan rumah.',
      price: 25000,
      type: 'REGULAR' as const,
      stock: 20,
      categoryId: createdCategories.find((c) => c.name === 'Donat Premium')!.id,
      image: 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?q=80&w=600&auto=format&fit=crop',
    },

    // --- KUE ULANG TAHUN (5) ---
    {
      name: 'Red Velvet Cake',
      description: 'Kue utuh red velvet dengan lapisan cream cheese yang padat dan super lembut. Cocok untuk perayaan.',
      price: 150000,
      type: 'DAILY_BAKE' as const,
      stock: 10,
      categoryId: createdCategories.find((c) => c.name === 'Kue Ulang Tahun')!.id,
      image: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Black Forest Cake',
      description: 'Kue cokelat klasik dengan cherry asli dan krim kocok berlimpah.',
      price: 140000,
      type: 'DAILY_BAKE' as const,
      stock: 8,
      categoryId: createdCategories.find((c) => c.name === 'Kue Ulang Tahun')!.id,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Tiramisu Cake',
      description: 'Kue tiramisu utuh dengan aroma kopi espresso dan mascarpone pekat.',
      price: 160000,
      type: 'DAILY_BAKE' as const,
      stock: 5,
      categoryId: createdCategories.find((c) => c.name === 'Kue Ulang Tahun')!.id,
      image: 'https://images.unsplash.com/photo-1571115177098-24de14cb2f55?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Strawberry Shortcake',
      description: 'Sponge cake vanilla yang sangat ringan dipadukan dengan strawberry segar.',
      price: 130000,
      type: 'DAILY_BAKE' as const,
      stock: 12,
      categoryId: createdCategories.find((c) => c.name === 'Kue Ulang Tahun')!.id,
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Vanilla Dream Cake',
      description: 'Kue vanilla simpel nan elegan dengan dekorasi buttercream cantik.',
      price: 120000,
      type: 'DAILY_BAKE' as const,
      stock: 15,
      categoryId: createdCategories.find((c) => c.name === 'Kue Ulang Tahun')!.id,
      image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=600&auto=format&fit=crop',
    },

    // --- MINUMAN (5) ---
    {
      name: 'Iced Caramel Macchiato',
      description: 'Kopi espresso dengan susu segar dan sirup karamel spesial buatan rumah. Sangat cocok disandingkan dengan donat!',
      price: 25000,
      type: 'REGULAR' as const,
      stock: 50,
      categoryId: createdCategories.find((c) => c.name === 'Minuman')!.id,
      image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Hot Matcha Latte',
      description: 'Minuman matcha hangat berpadu dengan susu steamed.',
      price: 22000,
      type: 'REGULAR' as const,
      stock: 40,
      categoryId: createdCategories.find((c) => c.name === 'Minuman')!.id,
      image: 'https://images.unsplash.com/photo-1515823064-28b3f2ec8c42?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Iced Americano',
      description: 'Es kopi hitam segar dari biji kopi arabica pilihan.',
      price: 18000,
      type: 'REGULAR' as const,
      stock: 60,
      categoryId: createdCategories.find((c) => c.name === 'Minuman')!.id,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Lychee Tea',
      description: 'Teh melati manis dengan buah leci utuh segar di dalamnya.',
      price: 20000,
      type: 'REGULAR' as const,
      stock: 45,
      categoryId: createdCategories.find((c) => c.name === 'Minuman')!.id,
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=600&auto=format&fit=crop',
    },
    {
      name: 'Hot Chocolate',
      description: 'Cokelat Belgia leleh yang disajikan panas, sangat menenangkan.',
      price: 24000,
      type: 'REGULAR' as const,
      stock: 35,
      categoryId: createdCategories.find((c) => c.name === 'Minuman')!.id,
      image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=600&auto=format&fit=crop',
    },
  ];

  let productsCreated = 0;
  for (const prod of products) {
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          type: prod.type,
          stock: prod.stock,
          categoryId: prod.categoryId,
          images: {
            create: {
              publicId: `seed_${prod.name.replace(/\s+/g, '_').toLowerCase()}`,
              urls: prod.image,
            },
          },
        },
      });
      productsCreated++;
    }
  }
  console.log(`✅ Products seeded: ${productsCreated} new items.`);
  console.log('Seeding selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
