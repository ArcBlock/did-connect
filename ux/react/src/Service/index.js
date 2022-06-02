import axios from 'axios';

export default function createService(baseURL, storage, timeout = 10000) {
  const service = axios.create({ baseURL, timeout });

  service.interceptors.request.use(
    config => {
      if (storage.engine === 'ls') {
        const token = storage.getToken();
        if (token) {
          config.headers.authorization = `Bearer ${encodeURIComponent(token)}`;
        }
      }

      return config;
    },
    error => Promise.reject(error)
  );

  return service;
}
