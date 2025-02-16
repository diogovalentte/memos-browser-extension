# Memos Browser Extension

A unofficial and simple browser extension to save memos of the currently open tab to [Memos](https://github.com/usememos/memos). It'll create notes using a specific design:

```markdown
# Current tab title
Current tab URL

Content

#Tag1 #Tag2 #Tag3
```

- You can change everything except the URL.

The extension is a copy-paste of the [Linkwarden browser extension](https://github.com/linkwarden/browser-extension) with some adaptations to be used with Memos.

## Features

- Add new memos to Memos with a single click.
- Sign in using API key.
- It'll show existing tags the extension popup for you to use. You can create tags from the extension too.
- The web pages are automatically saved in [Archive.org](https://archive.org/web/) for future reference.
- Option to set the memo create date (*make sure the timezones between your device/browser are in sync with the Memos instance timezone*).
- Context menu to append selected text to the content of an existing memo of the current page.

![Image](/assets/memos-extension.png)

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
chmod +x ./build.sh && ./build.sh
```

After the above command, use the `/dist` folder as an unpacked extension in your browser.
