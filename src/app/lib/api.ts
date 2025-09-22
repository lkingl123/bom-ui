// API configuration helper
// In development (npm run dev), this will use localhost:8000
// In production (npm run build/start), this will use bom-api.fly.dev
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bom-api.fly.dev';

export function getApiUrl(endpoint: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_API_URL || 'https://bom-api.fly.dev'
    : process.env.NEXT_PUBLIC_API_URL || 'https://bom-api.fly.dev';
  
  console.log(`[API] Using ${baseUrl} for ${endpoint}`);
  return `${baseUrl}${endpoint}`;
}