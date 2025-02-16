import axios from 'axios';

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

export async function getTags(baseUrl: string, apiKey: string) {
    const url = `${baseUrl}/api/v1/memos`;

    const response = await axios.get<{ memos: { tags: string[] }[] }>(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const uniqueTags = Array.from(new Set(response.data.memos.flatMap(memo => memo.tags)));

    const formattedTags: ResponseTags[] = uniqueTags.map((tag, index) => ({
      id: index + 1,
      name: tag,
      ownerId: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { links: 0 },
    }));

    return { data: { response: formattedTags } };
}
