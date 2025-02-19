import axios from 'axios';

export interface User {
    name: string,
}

export async function getUserStatus(url: string, apiKey: string): Promise<User> {
  url = `${url}/api/v1/auth/status`;
  const response = await axios.post(url, null, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.data;
}

export interface UserStats {
    tagCount: { [key: string]: number },
}

export async function getUserStats(url: string, apiKey: string, user: string): Promise<UserStats> {
  url = `${url}/api/v1/${user}/stats`;
  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.data;
}
