import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && typeof unauthorizedHandler === 'function') {
      try {
        await unauthorizedHandler(error);
      } catch (_e) {
        // ignore logout failures
      }
    }
    return Promise.reject(error);
  }
);

export default api;
