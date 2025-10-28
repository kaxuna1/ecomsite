export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
