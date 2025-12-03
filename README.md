<style>
   *{font-family: Times New Roman;}
   a{font-size:30px;border: solid 2px;padding:5px;border-radius:4px}
</style>
# Coursemo Search Assistant

by Nytsai

[InstallHere!!!](https://github.com/Nytsai1029/coursemo_search/raw/refs/heads/main/coursemo-search.user.js)


---
A Tampermonkey userscript that adds a floating control panel on `mo.coursemo.com` to search exam papers by ID range and flexible title matching (keywords or full title). It fetches paper metadata via the Coursemo API and surfaces matching links in-page.

## Features
- Toggleable on-page panel, styled and docked bottom-left.
- Search across a user-defined ID range.
- Two modes: keyword-based (all keywords must appear) or simple title-contains.
- Case/whitespace-insensitive matching; commas/spaces split keywords.
- Concurrent fetches for faster scanning and live progress updates.
- Results list with direct links to matching papers; “no result” messaging.

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
4) Click **Start search** to scan the range. Progress and results appear in the panel; each match links to its paper.

## Notes
- The script uses the API token embedded in `coursemo-search.user.js`; update `AUTH_TOKEN` if it expires.  
- Network requests hit `https://pct.coursemo.com/api/yarpc/com.coursemo.pct.ExamService.get?id=<ID>`; IDs are pulled from the range you enter.  
- If your browser blocks the calls (CORS/auth), ensure you’re logged in and the token is valid.

## Files
- `coursemo-search.user.js` — main userscript.  
- `fetch.md` — example fetch request with headers/token.  
- `fetch_ret.md` — sample API response structure.  
- `todo.md` — project requirements and notes.
