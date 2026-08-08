export const environment = {
  production: false,
  apiUrl: 'http://localhost:4200',
  // Use HTTP profile (dotnet run --launch-profile http). HTTPS :7018 is only up with the https profile.
  backendUrl: 'http://localhost:5190/api',
  aiServiceUrl: 'http://localhost:8000',
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
