const normalizeApiBase = (value: string) => value.trim().replace(/\/+$/, "").replace(/\/v1$/i, "");
const normalizeWorkshopApiBase = (value: string) => normalizeApiBase(value).replace(/\/workshop$/i, "");

const localAuthApi = "http://localhost:5010";
const localAuthFrontend = "http://localhost:5173";
const productionAuthApi = "https://aottg2.com";
const localWorkshopApi = "http://localhost:5011";

export const AUTH_API_BASE_URL = `${
  normalizeApiBase(process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? (process.env.NODE_ENV === "production" ? productionAuthApi : localAuthApi))
}/v1`;

export const AUTH_FRONTEND_LOGIN_URL = `${
  normalizeApiBase(process.env.NEXT_PUBLIC_AUTH_FRONTEND_BASE_URL ?? (process.env.NODE_ENV === "production" ? productionAuthApi : localAuthFrontend))
}/login`;

export const AUTH_FRONTEND_LOGOUT_URL = `${
  normalizeApiBase(process.env.NEXT_PUBLIC_AUTH_FRONTEND_BASE_URL ?? (process.env.NODE_ENV === "production" ? productionAuthApi : localAuthFrontend))
}/logout`;

export const WORKSHOP_API_BASE_URL = `${
  normalizeApiBase(process.env.NEXT_PUBLIC_WORKSHOP_API_BASE_URL ?? localWorkshopApi)
}/v1`;

export const WORKSHOP_CONTENT_API_BASE_URL = `${
  normalizeWorkshopApiBase(process.env.NEXT_PUBLIC_WORKSHOP_API_BASE_URL ?? localWorkshopApi)
}/v1/workshop`;

export const WORKSHOP_STATIC_API_ORIGIN = normalizeWorkshopApiBase(process.env.NEXT_PUBLIC_WORKSHOP_API_BASE_URL ?? localWorkshopApi);
