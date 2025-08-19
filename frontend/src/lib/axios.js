import axios from "axios";

const envBackend = import.meta.env.VITE_BACKEND_URL;
const apiBase = envBackend
  ? `${envBackend.replace(/\/$/, "")}/api`
  : import.meta.env.MODE === "development"
    ? "http://localhost:5001/api"
    : "/api";

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

export default api;
