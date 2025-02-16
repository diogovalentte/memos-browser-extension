import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMemos } from './actions/memos.ts';
import { getConfig } from './config.ts';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TabInfo {
  url: string;
  title: string;
}

export async function getCurrentTabInfo(): Promise<{ title: string | undefined; url: string | undefined }> {
  const tabs = await getBrowser().tabs.query({ active: true, currentWindow: true });
  const { url, title } = tabs[0];
  return { url, title };
}

export function getBrowser() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  return typeof browser !== 'undefined' ? browser : chrome;
}

export function getChromeStorage() {
  return typeof chrome !== 'undefined' && !!chrome.storage;
}

export async function getStorageItem(key: string) {
  if (getChromeStorage()) {
    const result = await getBrowser().storage.local.get([key]);
    return result[key];
  } else {
    return getBrowser().storage.local.get(key);
  }
}

export const checkDuplicatedItem = async () => {
  const currentTab = await getCurrentTabInfo();
  if (!currentTab.url) {
    return false;
  }
  const config = await getConfig();
  const memosResponse = await getMemos(config.baseUrl, config.apiKey, config.user, null);
  const URLs = memosResponse.memos.map((memo) => memo.content.split('\n')[1]);
  return URLs.includes(currentTab.url);
};

export async function setStorageItem(key: string, value: string) {
  if (getChromeStorage()) {
    return await chrome.storage.local.set({ [key]: value });
  } else {
    await getBrowser().storage.local.set({ [key]: value });
    return Promise.resolve();
  }
}

export function openOptions() {
  getBrowser().runtime.openOptionsPage();
}
