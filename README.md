# Kagumi v2 Backend API Documentation

A progressive backend application built with **NestJS**, **Prisma ORM**, **Zod** (for request validation), and **PostgreSQL**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database running locally or remotely

### Project Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables. Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/kagumi_db?schema=public"
   PORT=4015
   JWT_SECRET="your-super-secret-key"
   ```

3. Run Prisma Migrations to set up your database schema:
   ```bash
   npx prisma migrate dev
   ```

4. Start the application:
   ```bash
   # Development mode (with auto-reload)
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

---

## 📁 Project Architecture & Folder Structure

```text
src/
├── common/                  # Shared configurations, guards, filters, middlewares
│   ├── interceptors/        # Global logging interceptors
│   ├── logger/              # LoggerService wrapper around winston
│   ├── middleware/          # AuthMiddleware for request authorization
│   └── validation/          # Custom Zod validation decorators & pipes
├── helpers/                 # Utility services (response, tokens, crypto)
│   ├── response/            # Custom ResponseService to standardize HTTP responses
│   ├── token/               # JWT token creation and verification
│   └── crypto/              # Password hashing using bcryptjs
├── models/                  # Custom TypeScript models & interfaces (e.g. WebResponse)
├── modules/                 # App Feature Modules
│   ├── auth/                # Auth module (register, login, etc.)
│   ├── category/            # Category module (CRUD)
│   ├── product/             # Product module (CRUD)
│   └── user/                # User management
```

---

## 🔒 Request Validation & Custom Responses

### 1. Zod Validation
The project uses `nestjs-zod` for validating request payloads. DTOs are instantiated using `createZodDto` pointing to the Zod schemas located in `*.validation.ts` files.
Validation errors are handled globally and returned as structured HTTP 400 Bad Request responses.

### 2. Standardized Web Response
All controller routes return responses wrapped in a standard `WebResponse` structure using `ResponseService.success()`:
```json
{
  "success": true,
  "message": "Subject action successfully",
  "status": 200,
  "data": { ... },
  "timestamp": "2026-06-19T07:04:16.778Z"
}
```

---

## 📡 API Reference & Endpoints

### 🔑 Authentication (`/api/auth`)
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Login user (attaches HTTP-only JWT cookie `access_token`).

### 👤 Users (`/api/users`)
- `GET /api/users/current`: Retrieve current logged-in user profile.
- `PATCH /api/users/current/profile`: Update user profile details.
- `PATCH /api/users/current/password`: Change user password.
- `GET /api/users`: List all users (ADMIN role only).
- `DELETE /api/users/logout`: Clear JWT session cookies.

### 📁 Categories (`/api/categories`)
- `POST /api/categories`: Create a new category (ADMIN only).
- `GET /api/categories`: List all categories (ADMIN & USER).
- `GET /api/categories/:id`: Get category detail by ID (ADMIN & USER).
- `PATCH /api/categories/:id`: Update category by ID (ADMIN only).
- `DELETE /api/categories/:id`: Delete category by ID (ADMIN only, restricted if it contains child categories or products).

### 🏷️ Products (`/api/products`)
- `POST /api/products`: Create a new product (ADMIN only).
- `GET /api/products`: List all products (ADMIN & USER).
- `GET /api/products/:id`: Get product detail by ID (ADMIN & USER).
- `PATCH /api/products/:id`: Update product details (ADMIN only).
- `DELETE /api/products/:id`: Delete product by ID (ADMIN only).

### 📦 Orders (`/api/orders`)
- `POST /api/orders`: Create a new order (USER only). Calculates price automatically and reduces product stocks inside transaction.
- `GET /api/orders`: List orders (ADMIN sees all, USER sees only their own).
- `GET /api/orders/:id`: Get order detail by ID (ADMIN & order owner only).
- `PATCH /api/orders/:id`: Update order (ADMIN can change status/method; USER can only change status to `CANCELED` if current status is `PENDING`, which restores stock).
- `DELETE /api/orders/:id`: Hard delete order (ADMIN only).

---

## 🧪 Testing

The codebase includes comprehensive unit and integration testing.

```bash
# Run all unit tests (with mocks)
npm run test

# Run all E2E tests (Mock DB + Real DB validation)
npm run test:e2e
```

---

## 📮 Manual API Testing (REST Client)
For manual testing, you can use the **REST Client** extension in VS Code with the `.http` files stored under the `http/` directory:
- [http/auth.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/auth.http) - Register & login requests.
- [http/user.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/user.http) - User management & profile testing.
- [http/categories.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/categories.http) - Category CRUD requests.
- [http/products.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/products.http) - Product CRUD requests.
- [http/orders.http](file:///c:/Users/Yerikho/JavaScript/Kagumi-v2/backend/http/orders.http) - Order CRUD & status tracking requests.
