import api from './axiosInstance';
import { ApiResponse, LoginRequest, LoginResponse, User } from '../types';

export const authApi = {
  login: (data: LoginRequest) => api.post<ApiResponse<LoginResponse>>('/auth/login', data),
  refreshToken: (refreshToken: string) => api.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => api.post<ApiResponse>('/auth/logout', { refreshToken }),
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
};
