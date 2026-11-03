# RO’Lyfe Trading Calculator Pro — Project Handoff

**Repository:** https://github.com/ROLRichman/ROlyfe-Trading-Calculator-Pro
**Published root:** https://rolrichman.github.io/ROlyfe-Trading-Calculator-Pro/
**Scanner Hub:** https://rolrichman.github.io/ROlyfe-Trading-Calculator-Pro/scanner-hub/
**Implementation branch:** `feature/scanner-hub-directory`
**Updated:** November 2, 2026

## Current status

- The root index remains an organizing hub for trade sizing, options payoff, strategy builder and connected RO’Lyfe projects.
- Added a standalone Scanner Hub directory and a Scanner Directory dropdown in the root navigation.
- Available existing scanners are linked in their original projects: Tactical RTIC Live Scanner, Live Chart Desk Watchlist Scanner, Sports Center Sector Scanner & Chart Lab, and Market Terminal Scanner.
- The Classroom Market Room is included as practice workspace, explicitly not labeled as a live scanner.
- Six Calculator Pro module folders — Bullish, Bearish, Gap, High Volume, Earnings and Options — currently contain empty one-byte placeholders. They are not operational scan pages. Do not link users directly to these empty paths or report them as live.
- No scanner data engine was copied or reimplemented in this repository.

## Build boundaries

- Do not show sample quotes or fabricated scan rows as provider data.
- Any future module needs a named provider, response validation, timestamps, symbol coverage, failure state and tests before being marked available.
- This tool is not a brokerage connection and does not submit orders.

## Changes in this branch

- Add `scanner-hub/index.html` as a clear all-scanner landing page.
- Add Scanner Hub links and an app directory dropdown to the root Calculator Pro page.
- Update the Scanner Hub roadmap card to distinguish directory availability from the six still-empty module stubs.
- Preserve existing project links and calculation/planning pages.

**Status:** Pending CI / review. Not merged or deployed until approved.
