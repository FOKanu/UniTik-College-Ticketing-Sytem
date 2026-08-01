import { apiClient } from '../../../services/api-client';
import { LoginCredentials, LoginResult } from '../types/login.types';

export const loginService = {
  login: (credentials: LoginCredentials) => apiClient.post<LoginResult>('/auth/login', credentials),
};
