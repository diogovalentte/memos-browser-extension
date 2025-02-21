# Memos Browser Extension

An unofficial and simple web clip browser extension to save memos of the current page to [Memos](https://github.com/usememos/memos).

![Image](/assets/memos-extension.png)

By default, the extension will pre-fill the content field with the following design: 
```markdown
# Current tab title
- [Source](current tab URL)
```

- Changing the URL or not making it the second line of the meno content will break the context menu options (*more about [here](https://github.com/diogovalentte/memos-browser-extension#features)*).
- The tags selected in the tags input will be automatically added at the bottom of the content later, like `#tag1 #tag2`.

This extension is a fork of the [Linkwarden browser extension](https://github.com/linkwarden/browser-extension) with adaptations to be used with Memos.

## Features

- Add new memos to Memos with a single click.
- Sign in using the API key.
- Select the memo visibility and tags from the list of existing tags in Memos. You can create tags from the extension too.
- The web pages are automatically saved in [Archive.org](https://archive.org/web/) for future reference.
- Option to set the memo create date (*make sure the timezones between your device/browser are in sync with the Memos instance timezone*).
- Context menu options:
  - Right-click an **image** and append the image to the memo of the page (like `![Image](image URL)`).
  - Right-click a **link** and append the link to the content of the memo of the current page.
  - Right-click a **selected text** and append it to the content of the memo of the current page.
    - If the selected text contains links, it'll automatically create links in the Markdown format `[selected text](link)`.
  - Right-click the page (*without selecting anything*) and select to open the memo of the current page.

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

If you want to load a zip file, you can run:

```
cd dist && zip -r ../my-extension.zip * && cd ..
```
The zip file will be generated in the project root folder with the name `my-extension.zip`.
