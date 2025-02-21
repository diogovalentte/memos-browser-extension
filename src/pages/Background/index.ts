import { encodeContent, encodeURL, executeScript, getBrowser, } from '../../@/lib/utils.ts';
import { updateMemo, searchMemoByURL } from '../../@/lib/actions/memos.ts';
import { getConfig, isConfigured } from '../../@/lib/config.ts';
import OnClickData = chrome.contextMenus.OnClickData;

const browser = getBrowser();

// This is for the context menus!
// Example taken from: https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/api-samples/contextMenus/basic/sample.js
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await genericOnClick(info, tab);
});

// A generic onclick callback function.
async function genericOnClick(
  info: OnClickData,
  tab: chrome.tabs.Tab | undefined
) {
    const configured = await isConfigured();
    if (!tab?.url || !tab?.title || !configured) {
        return;
    }

    const config = await getConfig();

    if (info.menuItemId !== "openMemo") {
        let pageContent = "";
        if (info.menuItemId === "link" && info.linkUrl) {
            pageContent = info.linkUrl;
        } else if (info.menuItemId === "image" && info.srcUrl) {
            pageContent = "![Image](" + encodeURL(info.srcUrl) + ")";
        } else if (info.menuItemId === "selection" && info.selectionText) {
            if (!tab.id) {
                return;
            }
            pageContent = encodeContent(info.selectionText);
            executeScript(
                tab.id, getSelectedTextWithLinks
            ).then((result) => {
                const links: { text: string, url: string }[] = result;
                const baseMarker = '__MEMOS_MARKER__';
                const replacements = new Map<string, string>();
                let counter = 1;

                links.forEach((link) => {
                    let url = '';
                    try {
                        url = new URL(link.url).href;
                    } catch {
                        if (tab.url) {
                            if (link.url.startsWith('#')) {
                                url = tab.url + link.url;
                            } else {
                                try {
                                    url = new URL(link.url, new URL(tab.url).origin).href;
                                } catch (error) {
                                    console.error(error);
                                    url = '';
                                }
                            }
                        }
                    }
                    url = encodeURL(url);
                    let text = link.text;
                    pageContent = pageContent.replace(text, baseMarker + counter);
                    // text = text.replace(/(?<!\\)\[/g, '\\[').replace(/(?<!\\)\]/g, '\\]'); // Escape [] with \[\] if not already escaped. Unfortunately, this doesn't work with Memos markdown parser
                    text = text.replace(/\[/g, '(').replace(/\]/g, ')'); // Replace [] with ()
                    if (url !== '') {
                        replacements.set(baseMarker + counter, `[${text}](${url})`);
                    } else {
                        replacements.set(baseMarker + counter, text);
                    }
                    counter++;
                });
                replacements.forEach((value, key) => {
                    pageContent = pageContent.replace(key, value);
                });
            }).catch(console.error);
        }

        if (pageContent !== "") {
            try {
                const memo = await searchMemoByURL(config.baseUrl, config.apiKey, config.user, tab.url);
                if (memo) {
                    const lines = memo.content.split('\n');
                    const lastLine = lines.pop();

                    let newContent = "";
                    if (lastLine && lastLine[0] === '#') {
                        lines.push(pageContent);
                        lines.push('\n' + lastLine);
                        newContent = lines.join('\n');
                    } else {
                        newContent = memo.content + '\n\n' + pageContent;
                    }

                    updateMemo(config.baseUrl, memo.name, null, newContent, config.apiKey);
                }

            } catch (error) {
              console.error(error);
            }
        }
    } else {
        const memo = await searchMemoByURL(config.baseUrl, config.apiKey, config.user, tab.url);
        if (memo) {
            const url = `${config.baseUrl}/m/${memo.name.split('/')[1]}`;
            browser.tabs.create({ url });
        }
    }
}

function getSelectedTextWithLinks(): { text: string, url: string }[] {
  const selection = window.getSelection();
  const links: { text: string, url: string }[] = [];
  if (!selection || selection.rangeCount === 0) {
    return links;
  }

  const range = selection.getRangeAt(0);
  const container = document.createElement("div");
  container.appendChild(range.cloneContents());

  container.querySelectorAll("a").forEach((anchor) => {
    const linkText = anchor.textContent?.trim() || "Link";
    const href = anchor.getAttribute("href") || "";
    links.push({ text: linkText, url: href });
  });

  return links;
}

browser.runtime.onInstalled.addListener(function () {
});

browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo.tabId).then((tab) => {
    if (tab.url) {
        addContextMenuOptions(tab.url);
    } else {
      browser.tabs.onUpdated.addListener(function waitForUrl(tabId, _, updatedTab) {
        if (tabId === activeInfo.tabId && updatedTab.url) {
          browser.tabs.onUpdated.removeListener(waitForUrl);
          addContextMenuOptions(updatedTab.url);
        }
      });
    }
  });
});

browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'addContextMenuOptions') {
        addContextMenuOptions(message.memoUrl);
    }
});

async function addContextMenuOptions(tabURL: string) {
  const configured = await isConfigured();
  if (!configured) {
    return;
  }

  const config = await getConfig();
  const memo = await searchMemoByURL(config.baseUrl, config.apiKey, config.user, tabURL); 
  if (memo) {
      browser.contextMenus.create({
        title: 'Open memo',
        contexts: ['page'],
        id: 'openMemo',
      });
      browser.contextMenus.create({
        title: "Append link to page memo",
        contexts: ['link'],
        id: 'link',
      });
      browser.contextMenus.create({
        title: "Append selection to page memo",
        contexts: ['selection'],
        id: 'selection',
      });
      browser.contextMenus.create({
        title: "Append image to page memo",
        contexts: ['image'],
        id: 'image',
      });
  } else {
    browser.contextMenus.removeAll();
  }
}
