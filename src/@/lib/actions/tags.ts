import { getUserStats } from '../auth/auth';

interface ResponseTags {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    links: number;
  };
}

export async function getTags(baseUrl: string, apiKey: string, user: string) {
    const userStats = await getUserStats(baseUrl, apiKey, user);
    const tags = Object.keys(userStats.tagCount);
    const formattedTags: ResponseTags[] = tags.map((tag, index) => ({
      id: index + 1,
      name: tag,
      ownerId: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { links: 0 },
    }));

    return { data: { response: formattedTags } };
}
