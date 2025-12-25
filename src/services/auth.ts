export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

const API_URL = 'http://127.0.0.1:8000/api/v1';

export const authService = {
    setTokens: (data: LoginResponse) => {
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
    },

    getAccessToken: () => localStorage.getItem('accessToken'),
    getRefreshToken: () => localStorage.getItem('refreshToken'),

    clearTokens: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    login: async (email: string, password: string): Promise<LoginResponse> => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        authService.setTokens(data);
        return data;
    },

    refreshToken: async (): Promise<LoginResponse> => {
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            authService.clearTokens();
            throw new Error('Refresh failed');
        }

        const data = await response.json();
        authService.setTokens(data);
        return data;
    },

    fetchWithAuth: async (url: string, options: RequestInit = {}) => {
        let token = authService.getAccessToken();

        let response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.status === 401) {
            try {
                const newData = await authService.refreshToken();
                token = newData.access_token;

                // Retry request with new token
                response = await fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (error) {
                // Redirect to login if refresh fails
                window.location.href = '/login';
                throw error;
            }
        }

        return response;
    }
};
