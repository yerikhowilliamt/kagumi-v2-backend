import { UserSummary } from './user.model';

export class AccountResponse {
  id: number;
  userId: number;
  provider: string;
  providerAccountId: string;
  refreshToken?: string | null;
  createdAt: string;
  updatedAt: string;

  user?: UserSummary | null;

  constructor(params: {
    id: number;
    userId: number;
    provider: string;
    providerAccountId: string;
    createdAt: string;
    updatedAt: string;
  }) {
    const {id, userId, provider, providerAccountId, createdAt, updatedAt} = params;
    this.id = id;
    this.userId = userId;
    this.provider = provider;
    this.providerAccountId = providerAccountId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.user = null;
  }
}
