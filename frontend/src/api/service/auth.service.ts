import api from '../client';
import type {
    LoginCredentials,
    RegisterData,
    GoogleLoginData,
    LinkGoogleAccountData,
    AuthResponse,
    ChangePasswordData,
    ForgotPasswordData,
    ResetPasswordData,
} from '../types';

export const authService = {
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/register', data);
        return response.data;
    },

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/login', credentials);
        return response.data;
    },

    async googleLogin(data: GoogleLoginData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/google-login', data);
        return response.data;
    },

    async linkGoogleAccount(data: LinkGoogleAccountData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/link-google-account', data);
        return response.data;
    },

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/refresh-token', {
            refresh_token: refreshToken,
        });
        return response.data;
    },

    async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/change-password', data);
        return response.data;
    },

    async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/forgot-password', data);
        return response.data;
    },

    async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/reset-password', data);
        return response.data;
    },    async verifyEmail(token: string): Promise<{ message: string; already_verified?: boolean }> {
        const response = await api.get<{ message: string; already_verified?: boolean }>(`/verify-email?token=${token}`);
        return response.data;
    },

    async resendVerificationEmail(email: string): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/resend-verification', { email });
        return response.data;
    },

    async connectGoogleCalendar(code: string): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>('/connect-google-calendar', { code });
        return response.data;
    },
};
