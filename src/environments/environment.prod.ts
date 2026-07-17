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
      refresh: '/auth/refresh',
      me: '/auth/me',
      logout: '/auth/logout',
    },
  },
};
