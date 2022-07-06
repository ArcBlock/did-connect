import axios, { AxiosInstance } from 'axios';

export default function createService(baseURL: string, storage: any, timeout = 10000): AxiosInstance {
  const service = axios.create({ baseURL, timeout });

  service.interceptors.request.use(
    (config) => {
      if (storage.engine === 'ls') {
        const token = storage.getToken();
        if (token) {
          // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
          config.headers.authorization = `Bearer ${encodeURIComponent(token)}`;
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  return service;
}
