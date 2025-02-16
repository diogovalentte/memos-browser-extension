import axios from 'axios';
import { memoFormValues } from '../validators/memoForm.ts';

export async function postMemo(
  baseUrl: string,
  data: memoFormValues,
  apiKey: string,
) {
    const url = `${baseUrl}/api/v1/memos`;
    let content = `# ${data.name}\n${data.url}`;
    if (data.content) {
      content += `\n\n${data.content}`;
    }
    if (data.tags && data.tags.length > 0) {
      content += `\n\n#${data.tags.map(tag => tag.name).join(' #')}`;
    }

    const body = {
        "content": content,
        "visibility": data.visibility?.name,
    }

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return response.data;
}

export async function updateMemo(
  baseURL: string,
  memoName: string,
  createTime: string | null,
  content: string | null,
  apiKey: string,
) {
    const url = `${baseURL}/api/v1/${memoName}`;
    const body: { createTime?: string; content?: string } = {}
    if (createTime) {
        body.createTime = createTime;
    }
    if (content) {
        body.content = content;
    }
    return await axios.patch(url, body, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });
}

export interface Memo {
    name: string;
    content: string;
}

export async function getMemos(baseUrl: string, apiKey: string, user: string, nextPageToken: string | null): Promise<{ memos: Memo[], nextPageToken: string }> {
    let url = `${baseUrl}/api/v1/memos?parent=${user}`;

    if (nextPageToken) {
        url += `?pageToken=${nextPageToken}`;
    }

    const response = await axios.get<{ memos: { name: string, content: string }[], nextPageToken: string }>(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return { memos: response.data.memos, nextPageToken: response.data.nextPageToken };
}
