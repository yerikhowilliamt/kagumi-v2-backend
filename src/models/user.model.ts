import { AccountResponse } from './account.model';
import { OrderResponse, OrderSummary } from './order.model';
import { PaymentResponse, PaymentSummary } from './payment.model';

export class UserResponse {
  id: number;
  publicId?: string | null;
  name: string;
  email: string;
  emailVerified?: boolean | null | undefined;
  phone?: string | null;
  address?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  imageUrl?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;

  accounts: AccountResponse[];
  orders: OrderSummary[];
  payments: PaymentSummary[];

  constructor(params: {
    id: number;
    name: string;
    email: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
  }) {
    const { id, name, email, role, createdAt, updatedAt } = params;
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.accounts = [];
    this.orders = [];
    this.payments = [];
  }
}

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export class UserSummary {
  id: number;
  name: string;
  email: string;

  constructor(params: { id: number; name: string; email: string }) {
    const { id, name, email } = params;
    this.id = id;
    this.name = name;
    this.email = email;
  }
}