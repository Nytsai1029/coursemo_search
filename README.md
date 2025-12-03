# Coursemo Search Assistant

by Nytsai

[InstallHere!!!](https://github.com/Nytsai1029/coursemo_search/raw/refs/heads/main/coursemo-search.user.js)


---
A Tampermonkey userscript that adds a floating control panel on `mo.coursemo.com` to search exam papers by ID range with flexible title matching (keywords or full title) or creator ID filtering. It fetches paper metadata via the Coursemo API and surfaces matching links in-page.

## Features
- Toggleable on-page panel, styled and docked bottom-left.
- Search across a user-defined ID range.
- Three modes: keyword-based (all keywords must appear), simple title-contains, or creator-ID only.
- Case/whitespace-insensitive matching; commas/spaces split keywords.
- Concurrent fetches for faster scanning and live progress updates.
- Results list with direct links to matching papers; “no result” messaging; creator ID displayed for hits.

## Installation
1) Install **tampermonkey** or a compatible userscript manager.  
2) Download the script from github.
3) Save/enable the script and open any page under `https://mo.coursemo.com/`.

## Usage
1) Click the **Paper Search** button at the bottom-left to open the panel.  
2) Enter a start and end ID range.  
3) Choose a search mode:
   - **Keywords only**: fill **Keywords** (comma/space separated). All keywords must appear in the title.
   - **Title contains**: fill **Target title**; matches when the title contains that text.
   - **Creator ID only**: fill **Creator ID**; returns papers created by that user (ignores title/keywords).  
4) Click **Start search** to scan the range. Progress and results appear in the panel; each match links to its paper.

## Notes
- The script reads your token once from `localStorage.coursemo_token` (raw JWT string, see `token.md` format). Set/refresh it in the browser before searching.  
- User info is read once from `localStorage.mo_user` (JSON string containing id/username/phone/openid); no network calls are made to fetch it.  
- Network requests hit `https://pct.coursemo.com/api/yarpc/com.coursemo.pct.ExamService.get?id=<ID>`; IDs are pulled from the range you enter.  
- If your browser blocks the calls (CORS/auth), ensure you’re logged in and the token is valid.

## Files
- `coursemo-search.user.js` — main userscript.  
- `fetch.md` — example fetch request with headers/token.  
- `fetch_ret.md` — sample API response structure.  
- `todo.md` — project requirements and notes.

## Release note:

- **1.0.0**
  Basic function searching with title
- **1.0.1**
  When searching with title, capitalized letters and spaces won't affect the result.
- **1.0.2**
  Improve the styles.
- **1.0.3**
  New feature of searching by keywords.
- **1.1.0**
  New feature of searching by creator id.
  New feature of pressing rightarrow or leftarrow key for switching to previous/next paper.
  Fix the bug that the paper searching button will appear on the printing window.
- **1.1.1**
  Use your own token instead of others.