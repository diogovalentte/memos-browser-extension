# Memos Browser Extension

An unofficial and simple web clip browser extension to save memos of the current page to [Memos](https://github.com/usememos/memos).

![Image](/assets/memos-extension.png)

By default, the content will be automatically created using the design below, but you can change it on the extension popup before saving (*except for the tags*).
```markdown
# Current tab title
- [Source](current tab URL)

#Tag1 #Tag2 #Tag3
```

The extension is a fork of the [Linkwarden browser extension](https://github.com/linkwarden/browser-extension) with adaptations for use with Memos.

## Features

- Add new memos to Memos with a single click.
- Sign in using the API key.
- Select the memo visibility and tags from a list of existing tags in your Memos instance. You can create tags from the extension too.
- The web pages are automatically saved in [Archive.org](https://archive.org/web/) for future reference.
- Option to set the memo create date (*make sure the timezones between your device/browser are in sync with the Memos instance timezone*).
- Context menu options:
  - Right-click an image and select to append image to the existing memo of the page (like `[Image](image URL)`).
  - Right-click a selected text and select to append to the content of the existing memo of the current page.
    - If the selected text contains links, it'll automatically create links in the Markdown format `[selected text](link)`.
  - Right-click the page (*without selecting image or text*) and select to open the existing memo of the current page.

## Installation

No available installation yet. You can build the extension from source.

## Build From Source

### Requirements

- LTS NodeJS 18.x.x
- NPM Version 9.x.x
- Bash
- Git

### Step 1: Clone this repo

Clone this repository by running the following in your terminal:

```
git clone https://github.com/diogovalentte/memos-browser-extension.git
```

### Step 2: Build

Head to the generated folder:

```
cd memos-browser-extension
```

And run:

```
# Chrome
chmod +x ./build.sh && ./build.sh

# Firefox
chmod +x ./build.sh && ./build.sh --firefox
```

After the above command, use the `/dist` folder as an unpacked extension in your browser.
