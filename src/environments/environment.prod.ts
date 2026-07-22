export const environment = {
  production: true,
  apiUrl: '',
  backendUrl: '/api',
  aiServiceUrl: '/ai',
  apiKey: '',
  apiKeyHeader: 'X-Api-Key',
  apiKeyPrefix: 'Bearer',
  auth: {
    endpoints: {
      login: '/auth/login',
      register: '/auth/register',
      refresh: '/auth/refresh-token',
      refreshToken: '/auth/refresh-token',
      me: '/auth/me',
      logout: '/auth/logout',
      confirmEmail: '/auth/confirm-email',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      phone: '/auth/phone',
    },
  },
};
