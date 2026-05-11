import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me")
};

export const datasetApi = {
  upload: (formData) => api.post("/datasets/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  list: () => api.get("/datasets"),
  get: (id) => api.get(`/datasets/${id}`),
  analytics: (id, params) => api.get(`/datasets/${id}/analytics`, { params })
};

export const modelApi = {
  train: (payload) => api.post("/models/train", payload),
  list: () => api.get("/models"),
  get: (id) => api.get(`/models/${id}`),
  predict: (payload) => api.post("/models/predict", payload),
  tree: (id) => api.get(`/models/${id}/tree`)
};

export const dashboardApi = {
  stats: (params) => api.get("/dashboard/stats", { params })
};

export const reportApi = {
  list: () => api.get("/reports"),
  export: (payload) => api.post("/reports/export", payload, { responseType: "blob" })
};

export const adminApi = {
  overview: () => api.get("/admin/overview")
};

export default api;
