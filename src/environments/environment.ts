export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:5190/api',
  aiServiceUrl: 'http://localhost:8000',
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
