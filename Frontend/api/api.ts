// reposphere-react/api/api.ts
export const fetchHello = async (): Promise<{ message: string }> => {
  const response = await fetch('/api/hello'); // or '/api/hello' if using Vite proxy
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  const data = await response.json();
  return data;
};
