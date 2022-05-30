import axios from 'axios';
import Qs from 'qs';

const api = axios.create({
  paramsSerializer: (params) => {
    return Qs.stringify(params);
  },
});

async function requestFn(config) {
  const prefix = window?.blocklet?.prefix || '/';
  config.baseURL = prefix || '';
  // config.baseURL = '/.well-known/service';
  config.timeout = 200000;
  // 请求之前加loading
  return config;
}
async function responseFn(config) {
  // 响应成功关闭loading
  return config;
}
function errorFn(error) {
  return Promise.reject(error);
}

api.interceptors.request.use(requestFn, errorFn);
api.interceptors.request.use(responseFn, errorFn);

export default api;
