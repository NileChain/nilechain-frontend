export const environment = {
  production: true,
  apiUrl: '',
  // Production ASP.NET API (Heroku). Paths below are appended by services
  // (e.g. /auth/login → …/api/auth/login). Trailing slash omitted on purpose.
  backendUrl: 'https://nilechain-api-ee4cc7889a58.herokuapp.com/api',
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
