import { getBrowser, getCurrentTabInfo } from '../../@/lib/utils.ts';
import { getMemos, updateMemo, Memo } from '../../@/lib/actions/memos.ts';
// import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import { getConfig, isConfigured } from '../../@/lib/config.ts';
import {
  // deleteBookmarkMetadata,
  // getBookmarkMetadataByBookmarkId,
  // getBookmarkMetadataByUrl,
  getBookmarksMetadata,
} from '../../@/lib/cache.ts';
import ContextType = chrome.contextMenus.ContextType;
import OnClickData = chrome.contextMenus.OnClickData;
import OnInputEnteredDisposition = chrome.omnibox.OnInputEnteredDisposition;
// import {
//   getCsrfTokenFetch,
//   getSessionFetch,
//   performLoginOrLogoutFetch,
// } from '../../@/lib/auth/auth.ts';

const browser = getBrowser();

// This is the main functions that will be called when a bookmark is created, update or deleted
// Won't work with axios xhr or something not supported by the browser

// browser.bookmarks.onCreated.addListener(
//   async (_id: string, bookmark: BookmarkTreeNode) => {
//     try {
//       const { syncBookmarks, baseUrl, username, password } = await getConfig();
//       if (!syncBookmarks || !bookmark.url) {
//         return;
//       }
//       const session = await getSessionFetch(baseUrl);

//       // Check if the bookmark already exists in the server by checking the url so, it doesn't create duplicates
//       // I know, could use the method search from the api, but I want to avoid as much api specific calls as possible
//       // in case isn't supported, so I prefer to do it this way, if performance is an issue I will think of change to that.

//       const existingLink = await getBookmarkMetadataByUrl(bookmark.url);
//       if (existingLink) {
//         return;
//       }

//       if (!session) {
//         const csrfToken = await getCsrfTokenFetch(baseUrl);

//         await performLoginOrLogoutFetch(
//           `${baseUrl}/api/v1/auth/callback/credentials`,
//           {
//             csrfToken: csrfToken,
//             callbackUrl: `${baseUrl}/api/v1/auth/callback`,
//             json: true,
//             redirect: false,
//             username: username,
//             password: password,
//           }
//         );
//       }

//       const newLink = await postLinkFetch(baseUrl, {
//         url: bookmark.url,
//         collection: {
//           name: 'Unorganized',
//         },
//         tags: [],
//         name: bookmark.title,
//         description: bookmark.title,
//       });

//       const newLinkJson = await newLink.json();
//       const newLinkUrl: bookmarkMetadata = newLinkJson.response;
//       newLinkUrl.bookmarkId = bookmark.id;

//       await saveBookmarkMetadata(newLinkUrl);
//     } catch (error) {
//       console.error(error);
//     }
//   }
// );

// browser.bookmarks.onChanged.addListener(
//   async (id: string, changeInfo: chrome.bookmarks.BookmarkChangeInfo) => {
//     try {
//       const { syncBookmarks, baseUrl, username, password, usingSSO } =
//         await getConfig();
//       if (!syncBookmarks || !changeInfo.url) {
//         return;
//       }

//       const link = await getBookmarkMetadataByBookmarkId(id);

//       if (!link) {
//         return;
//       }

//       const session = await getSessionFetch(baseUrl);

//       if (!session && !usingSSO) {
//         const csrfToken = await getCsrfTokenFetch(baseUrl);

//         await performLoginOrLogoutFetch(
//           `${baseUrl}/api/v1/auth/callback/credentials`,
//           {
//             csrfToken: csrfToken,
//             callbackUrl: `${baseUrl}/api/v1/auth/callback`,
//             json: true,
//             redirect: false,
//             username: username,
//             password: password,
//           }
//         );
//       } else if (!session && usingSSO) {
//         return;
//       }

//       const updatedLink = await updateLinkFetch(baseUrl, link.id, {
//         url: changeInfo.url,
//         collection: {
//           name: 'Unorganized',
//         },
//         tags: [],
//         name: changeInfo.title,
//         description: changeInfo.title,
//       });

//       const updatedLinkJson = await updatedLink.json();
//       const newLinkUrl: bookmarkMetadata = updatedLinkJson.response;
//       newLinkUrl.bookmarkId = id;

//       await saveBookmarkMetadata(newLinkUrl);
//     } catch (error) {
//       console.error(error);
//     }
//   }
// );

// browser.bookmarks.onRemoved.addListener(
//   async (id: string, removeInfo: chrome.bookmarks.BookmarkRemoveInfo) => {
//     try {
//       const { syncBookmarks, baseUrl } =
//         await getConfig();
//       if (!syncBookmarks || !removeInfo.node.url) {
//         return;
//       }
//       const link = await getBookmarkMetadataByBookmarkId(id);

//       if (!link) {
//         return;
//       }

//       const session = await getSessionFetch(baseUrl);

//       if (!session) {
//         const csrfToken = await getCsrfTokenFetch(baseUrl);

//         await performLoginOrLogoutFetch(
//           `${baseUrl}/api/v1/auth/callback/credentials`,
//           {
//             csrfToken: csrfToken,
//             callbackUrl: `${baseUrl}/api/v1/auth/callback`,
//             json: true,
//             redirect: false,
//             username: username,
//             password: password,
//           }
//         );
//       } else if (!session && usingSSO) {
//         return;
//       }

//       await Promise.all([
//         deleteBookmarkMetadata(link.bookmarkId),
//         deleteLinkFetch(baseUrl, link.id),
//       ]);
//     } catch (error) {
//       console.error(error);
//     }
//   }
// );

// This is for the context menus!
// Example taken from: https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/api-samples/contextMenus/basic/sample.js
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await genericOnClick(info, tab);
});

function findInSecondLine(list: { name: string, content: string }[], searchString: string): Memo | null {
  for (const memo of list) {
    const lines = memo.content.split('\n'); 
    if (lines[1] && lines[1].includes(searchString)) {
      return { content: memo.content, name: memo.name }; 
    }
  }
  return null;
}

// A generic onclick callback function.
async function genericOnClick(
  info: OnClickData,
  tab: chrome.tabs.Tab | undefined
) {
  const configured = await isConfigured();
  if (!tab?.url || !tab?.title || !configured) {
    return;
  }
    
    if (info.selectionText) {
        const config = await getConfig();
        try {
            let nextPageToken = null;
            let memo: Memo | null = null;
            while (nextPageToken !== "") {
                const memosResponse = await getMemos(config.baseUrl, config.apiKey, config.user, nextPageToken);
                memo = findInSecondLine(memosResponse.memos, tab.url);
                if (memo) {
                    break
                }
                nextPageToken = memosResponse.nextPageToken;
            }

            if (memo) {
                const lines = memo.content.split('\n');
                const lastLine = lines.pop();

                let newContent = "";
                if (lastLine && lastLine[0] === '#') {
                    lines.push(info.selectionText);
                    lines.push('\n' + lastLine);
                    newContent = lines.join('\n');
                } else {
                    newContent = memo.content + '\n\n' + info.selectionText;
                }

                updateMemo(config.baseUrl, memo.name, null, newContent, config.apiKey);
            }

        } catch (error) {
          console.error(error);
        }
    }
}
browser.runtime.onInstalled.addListener(function () {
  // Create one test item for each context type.
  const contexts: ContextType[] = [
    'selection',
    'editable',
  ];
  for (const context of contexts) {
    const title: string = 'Append to current page memo';
    browser.contextMenus.create({
      title: title,
      contexts: [context],
      id: context,
    });
  }
});

// Omnibox implementation

browser.omnibox.onInputStarted.addListener(async () => {
  const configured = await isConfigured();
  const description = configured
    ? 'Search links in linkwarden'
    : 'Please configure the extension first';

  browser.omnibox.setDefaultSuggestion({
    description: description,
  });
});

browser.omnibox.onInputChanged.addListener(
  async (
    text: string,
    suggest: (arg0: { content: string; description: string }[]) => void
  ) => {
    const configured = await isConfigured();

    if (!configured) {
      return;
    }

    const currentBookmarks = await getBookmarksMetadata();

    const searchedBookmarks = currentBookmarks.filter((bookmark) => {
      return bookmark.name?.includes(text) || bookmark.url.includes(text);
    });

    const bookmarkSuggestions = searchedBookmarks.map((bookmark) => {
      return {
        content: bookmark.url,
        description: bookmark.name || bookmark.url,
      };
    });
    suggest(bookmarkSuggestions);
  }
);

// This part was taken https://github.com/sissbruecker/linkding-extension/blob/master/src/background.js Thanks to @sissbruecker

browser.omnibox.onInputEntered.addListener(
  async (content: string, disposition: OnInputEnteredDisposition) => {
    if (!(await isConfigured()) || !content) {
      return;
    }

    const isUrl = /^http(s)?:\/\//.test(content);
    const url = isUrl ? content : `lk`;

    // Edge doesn't allow updating the New Tab Page (tested with version 117).
    // Trying to do so will throw: "Error: Cannot update NTP tab."
    // As a workaround, open a new tab instead.
    if (disposition === 'currentTab') {
      const tabInfo = await getCurrentTabInfo();
      if (tabInfo.url === 'edge://newtab/') {
        disposition = 'newForegroundTab';
      }
    }

    switch (disposition) {
      case 'currentTab':
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await browser.tabs.update({ url });
        break;
      case 'newForegroundTab':
        await browser.tabs.create({ url });
        break;
      case 'newBackgroundTab':
        await browser.tabs.create({ url, active: false });
        break;
    }
  }
);
