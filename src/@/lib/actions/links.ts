import { bookmarkFormValues } from '../validators/bookmarkForm.ts';
import axios from 'axios';
import { bookmarkMetadata } from '../cache.ts';

export async function postMemo(
  baseUrl: string,
  data: bookmarkFormValues,
  apiKey: string
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
        "visibility": "PUBLIC",
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

export async function postLinkFetch(
  baseUrl: string,
  data: bookmarkFormValues,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links`;

  return await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function updateLinkFetch(
  baseUrl: string,
  id: number,
  data: bookmarkFormValues,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links/${id}`;

  return await fetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function deleteLinkFetch(
  baseUrl: string,
  id: number,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links/${id}`;

  return await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function getLinksFetch(
  baseUrl: string,
  apiKey: string
): Promise<{ response: bookmarkMetadata[] }> {
  const url = `${baseUrl}/api/v1/memos`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  return await response.json();
}

export async function getMemos(baseUrl: string, apiKey: string) {
    const url = `${baseUrl}/api/v1/memos`;

    const response = await axios.get<{ memos: { name: string, content: string }[] }>(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return response.data.memos;
}

export async function getMemosContent(baseUrl: string, apiKey: string) {
    const url = `${baseUrl}/api/v1/memos`;

    const response = await axios.get<{ memos: { content: string }[] }>(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    return response.data.memos.map(str => {
        const lines = str.content.split('\n');
        return lines[1] || '';  // Return the second line or an empty string if it doesn't exist
        }
    );
}
