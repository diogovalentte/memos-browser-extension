import {
    encodeContent,
    encodeURL,
    executeScript,
    getBrowser,
} from '../../@/lib/utils.ts';
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

    if (info.menuItemId !== 'openMemo') {
        let pageContent = '';
        if (info.menuItemId === 'link' && info.linkUrl) {
            pageContent = info.linkUrl;
        } else if (info.menuItemId === 'image' && info.srcUrl) {
            pageContent = '![Image](' + encodeURL(info.srcUrl) + ')';
        } else if (info.menuItemId === 'selection' && info.selectionText) {
            if (!tab.id) {
                return;
            }
            pageContent = encodeContent(info.selectionText);
            executeScript(tab.id, getSelectedTextElements)
                .then((result) => {
                    const data: {
                        links: { text: string; url: string }[];
                        strongs: string[];
                        ulItems: string[];
                        olItems: { number: number; text: string }[];
                        headers: {
                            h1: string[];
                            h2: string[];
                            h3: string[];
                            h4: string[];
                            h5: string[];
                            h6: string[];
                        };
                    } = result;
                    const baseMarker = '__MEMOS_MARKER__';
                    let replacements = new Map<string, string>();
                    let counter = 1;

                    data.olItems.forEach((item) => {
                        pageContent = pageContent.replace(item.text, baseMarker + counter);
                        replacements.set(
                            baseMarker + counter,
                            `${item.number}. ${item.text}`
                        );
                        counter++;
                    });
                    replacements.forEach((value, key) => {
                        pageContent = pageContent.replace(key, value);
                    });
                    replacements = new Map<string, string>();
                    counter = 1;

                    data.ulItems.forEach((item) => {
                        pageContent = pageContent.replace(item, baseMarker + counter);
                        replacements.set(baseMarker + counter, `- ${item}`);
                        counter++;
                    });
                    replacements.forEach((value, key) => {
                        pageContent = pageContent.replace(key, value);
                    });
                    replacements = new Map<string, string>();
                    counter = 1;

                    data.strongs.forEach((strong) => {
                        pageContent = pageContent.replace(strong, baseMarker + counter);
                        replacements.set(baseMarker + counter, `**${strong}**`);
                        counter++;
                    });
                    replacements.forEach((value, key) => {
                        pageContent = pageContent.replace(key, value);
                    });
                    replacements = new Map<string, string>();
                    counter = 1;

                    data.links.forEach((link) => {
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
                    replacements = new Map<string, string>();
                    counter = 1;

                    data.headers.h1.forEach((header) => {
                        pageContent = pageContent.replace(header, baseMarker + counter);
                        replacements.set(baseMarker + counter, `# ${header}`);
                        counter++;
                    });
                    data.headers.h2.forEach((header) => {
                        pageContent = pageContent.replace(header, baseMarker + counter);
                        replacements.set(baseMarker + counter, `## ${header}`);
                        counter++;
                    });
                    data.headers.h3.forEach((header) => {
                        pageContent = pageContent.replace(header, baseMarker + counter);
                        replacements.set(baseMarker + counter, `### ${header}`);
                        counter++;
                    });
                    data.headers.h4.forEach((header) => {
                        pageContent = pageContent.replace(header, baseMarker + counter);
                        replacements.set(baseMarker + counter, `#### ${header}`);
                        counter++;
                    });
                    data.headers.h5.forEach((header) => {
                        pageContent = pageContent.replace(header, baseMarker + counter);
                        replacements.set(baseMarker + counter, `##### ${header}`);
                        counter++;
                    });
                    data.headers.h6.forEach((header) => {
                        pageContent = pageContent.replace(header, baseMarker + counter);
                        replacements.set(baseMarker + counter, `###### ${header}`);
                        counter++;
                    });

                    replacements.forEach((value, key) => {
                        pageContent = pageContent.replace(key, value);
                    });
                })
                .catch(console.error);
        }

        if (pageContent !== '') {
            try {
                const memo = await searchMemoByURL(
                    config.baseUrl,
                    config.apiKey,
                    config.user,
                    tab.url
                );
                if (memo) {
                    const lines = memo.content.split('\n');
                    const lastLine = lines.pop();

                    let newContent = '';
                    if (lastLine && lastLine[0] === '#') {
                        lines.push(pageContent);
                        lines.push('\n' + lastLine);
                        newContent = lines.join('\n');
                    } else {
                        newContent = memo.content + '\n\n' + pageContent;
                    }

                    updateMemo(
                        config.baseUrl,
                        memo.name,
                        null,
                        newContent,
                        config.apiKey
                    );
                }
            } catch (error) {
                console.error(error);
            }
        }
    } else {
        const memo = await searchMemoByURL(
            config.baseUrl,
            config.apiKey,
            config.user,
            tab.url
        );
        if (memo) {
            const url = `${config.baseUrl}/m/${memo.name.split('/')[1]}`;
            browser.tabs.create({ url });
        }
    }
}

function getSelectedTextElements(): {
    links: { text: string; url: string }[];
    strongs: string[];
    ulItems: string[];
    olItems: { number: number; text: string }[];
    headers: {
        h1: string[];
        h2: string[];
        h3: string[];
        h4: string[];
        h5: string[];
        h6: string[];
    };
} {
    const links: { text: string; url: string }[] = [];
    const strongs: string[] = [];
    const ulItems: string[] = [];
    const olItems: { number: number; text: string }[] = [];
    const headers: {
        h1: string[];
        h2: string[];
        h3: string[];
        h4: string[];
        h5: string[];
        h6: string[];
    } = {
        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],
    };
    const data = {
        links: links,
        strongs: strongs,
        ulItems: ulItems,
        olItems: olItems,
        headers: headers,
    };

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return data;
    }

    const range = selection.getRangeAt(0);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());

    container.querySelectorAll('a').forEach((anchor) => {
        const linkText = anchor.textContent?.trim() || 'Link';
        const href = anchor.getAttribute('href') || '';
        data.links.push({ text: linkText, url: href });
    });

    container.querySelectorAll('strong').forEach((anchor) => {
        const text = anchor.textContent?.trim();
        if (!text) {
            return;
        }
        data.strongs.push(text);
    });

    container.querySelectorAll('ul').forEach((ul) => {
        const items = Array.from(ul.querySelectorAll('li'))
            .map((li) => li.textContent?.trim())
            .filter(Boolean) as string[];
        data.ulItems.push(...items);
    });
    container.querySelectorAll('ol').forEach((ol) => {
        let counter = 1;
        const items: { number: number; text: string }[] = [];
        ol.querySelectorAll('li').forEach((li) => {
            const text = li.textContent?.trim();
            if (!text) {
                return null;
            }
            const number = counter;
            counter++;
            return { number: number, text: text };
        });
        data.olItems.push(...items);
    });

    container.querySelectorAll('h1').forEach((anchor) => {
        const text = anchor.textContent?.trim();
        if (!text) {
            return;
        }
        data.headers.h1.push(text);
    });
    container.querySelectorAll('h2').forEach((anchor) => {
        const text = anchor.textContent?.trim();
        if (!text) {
            return;
        }
        data.headers.h2.push(text);
    });
    container.querySelectorAll('h3').forEach((anchor) => {
        const text = anchor.textContent?.trim();
        if (!text) {
            return;
        }
        data.headers.h3.push(text);
    });
    container.querySelectorAll('h4').forEach((anchor) => {
        const text = anchor.textContent?.trim();
        if (!text) {
            return;
        }
        data.headers.h4.push(text);
    });
    container.querySelectorAll('h5').forEach((anchor) => {
        const text = anchor.textContent?.trim();
        if (!text) {
            return;
        }
        data.headers.h5.push(text);
    });
    container.querySelectorAll('h6').forEach((anchor) => {
        const text = anchor.textContent?.trim();
        if (!text) {
            return;
        }
        data.headers.h6.push(text);
    });

    return data;
}

browser.runtime.onInstalled.addListener(function() { });

browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.get(activeInfo.tabId).then((tab) => {
        if (tab.url) {
            addContextMenuOptions(tab.url);
        } else {
            browser.tabs.onUpdated.addListener(
                function waitForUrl(tabId, _, updatedTab) {
                    if (tabId === activeInfo.tabId && updatedTab.url) {
                        browser.tabs.onUpdated.removeListener(waitForUrl);
                        addContextMenuOptions(updatedTab.url);
                    }
                }
            );
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
    const memo = await searchMemoByURL(
        config.baseUrl,
        config.apiKey,
        config.user,
        tabURL
    );
    if (memo) {
        browser.contextMenus.create({
            title: 'Open memo',
            contexts: ['page'],
            id: 'openMemo',
        });
        browser.contextMenus.create({
            title: 'Append link to page memo',
            contexts: ['link'],
            id: 'link',
        });
        browser.contextMenus.create({
            title: 'Append selection to page memo',
            contexts: ['selection'],
            id: 'selection',
        });
        browser.contextMenus.create({
            title: 'Append image to page memo',
            contexts: ['image'],
            id: 'image',
        });
    } else {
        browser.contextMenus.removeAll();
    }
}
