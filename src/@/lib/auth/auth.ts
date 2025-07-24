import axios from 'axios';

export interface User {
    name: string;
}

export async function getUserStatus(
    url: string,
    apiKey: string
): Promise<User> {
    url = `${url}/api/v1/auth/sessions/current`;
    const response = await axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
    });

    return response.data.user;
}

export interface UserStats {
    tagCount: { [key: string]: number };
}

export async function getUserStats(
    url: string,
    apiKey: string,
    user: string
): Promise<UserStats> {
    url = `${url}/api/v1/${user}:getStats`;
    const response = await axios.get(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
    });

    return response.data;
}
