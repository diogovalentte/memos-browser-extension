import axios from 'axios';

export interface DataLogin {
  username: string;
  password: string;
  redirect: boolean;
  csrfToken: string;
  callbackUrl: string;
  json: boolean;
}

export interface DataLogout {
  csrfToken: string;
  callbackUrl: string;
  json: boolean;
}

export async function getCsrfTokenFetch(url: string): Promise<string> {
  const token = await fetch(`${url}/api/v1/auth/csrf`);
  const { csrfToken } = await token.json();
  return csrfToken;
}

export async function performLoginOrLogout(
  url: string,
  data: DataLogin | DataLogout
) {
  const formBody = Object.entries(data)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');

  return await axios.post(url, formBody, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

export async function getSession(
  url: string,
  username: string,
  password: string
) {
  const session = await axios.post(
    `${url}/api/v1/session`,
    {
      username,
      password,
      sessionName: 'Browser Extension',
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return session;
}

export async function getSessionFetch(url: string) {
  const session = await fetch(`${url}/api/v1/auth/session`);
  const sessionJson = await session.json();
  return sessionJson.user;
}

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
