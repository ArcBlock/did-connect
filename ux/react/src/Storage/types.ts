import { LiteralUnion } from 'type-fest';

export type EngineType = LiteralUnion<'ls' | 'cookie', string>;

export interface StorageEngine {
  getToken(): string | undefined | null;
  setToken(token: string): void;
  removeToken(): void;
  engine?: EngineType;
  key?: string;
}
