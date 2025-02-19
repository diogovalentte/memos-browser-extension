import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { searchMemoByURL } from './actions/memos.ts';
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
  const memo = await searchMemoByURL(config.baseUrl, config.apiKey, config.user, currentTab.url);

  return !!memo;
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

export function encodeURL(url: string) {
  return url.replace(/\(/g, "%28").replace(/\)/g, "%29");
}

export async function executeScript(tabId: number, func: any, args: any[] = []) {
  if (typeof chrome.scripting !== 'undefined') {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args,
    });
    return results[0]?.result;
  } else {
    const results = await browser.tabs.executeScript(tabId, {
      code: `(${func})(${args.map((arg) => JSON.stringify(arg)).join(',')})`,
    });
    return results[0];
  }
}

