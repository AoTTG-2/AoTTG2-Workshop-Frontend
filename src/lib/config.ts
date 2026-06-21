const normalizeApiBase = (value: string) => value.trim().replace(/\/+$/, "").replace(/\/v1$/i, "");

const localAuthApi = "http://localhost:5010";
const productionAuthApi = "https://aottg2.com";
const localWorkshopApi = "http://localhost:5011";

export const AUTH_API_BASE_URL = `${
  normalizeApiBase(import.meta.env.VITE_AUTH_API_BASE_URL ?? (import.meta.env.PROD ? productionAuthApi : localAuthApi))
}/v1`;

export const WORKSHOP_API_BASE_URL = `${
  normalizeApiBase(import.meta.env.VITE_WORKSHOP_API_BASE_URL ?? localWorkshopApi)
}/v1`;
