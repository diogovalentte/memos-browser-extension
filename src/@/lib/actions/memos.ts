import axios from 'axios';
import { memoFormValues } from '../validators/memoForm.ts';
import { encodeURL } from '../utils.ts';

export async function postMemo(
  baseUrl: string,
  data: memoFormValues,
  apiKey: string,
) {
    const url = `${baseUrl}/api/v1/memos`;
    let content = data.content;
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
    const body: { createTime?: string; content?: string } = {};
    if (createTime) {
        body.createTime = createTime;
    }
    if (content) {
        body.content = content;
    }
    
    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
}

export interface Memo {
    name: string;
    content: string;
    tags: string[];
}

export async function getMemos(baseUrl: string, apiKey: string, user: string, filter: string | null, nextPageToken: string | null): Promise<{ memos: Memo[], nextPageToken: string }> {
    let url = `${baseUrl}/api/v1/memos?parent=${user}`;

    if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
    }
    if (filter) {
        url += `&filter=${filter}`;
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return { memos: data.memos, nextPageToken: data.nextPageToken };
}

// Search a memo by URL
export async function searchMemoByURL(baseUrl: string, apiKey: string, user: string, url: string): Promise<Memo | null> {
    const fixedURL = encodeURL(url.split('?')[0].split('#')[0]);
    const filter = `content.contains("${fixedURL}")`;
    const memosResp = await getMemos(baseUrl, apiKey, user, filter, null);

    return memosResp.memos.length > 0 ? memosResp.memos[0] : null; 
}
