# RO’Lyfe Trading Calculator Pro — Project Handoff

**Repository:** https://github.com/ROLRichman/ROlyfe-Trading-Calculator-Pro
**Published root:** https://rolrichman.github.io/ROlyfe-Trading-Calculator-Pro/
**Scanner Hub:** https://rolrichman.github.io/ROlyfe-Trading-Calculator-Pro/scanner-hub/
**Implementation branch:** `feature/scanner-hub-directory`
**Updated:** November 2, 2026

## Current state

- Root index remains an organizing hub for trade sizing, options payoff, strategy builder and connected RO’Lyfe projects.
- Added a Scanner Directory dropdown and a dedicated Scanner Hub landing page.
- Active scanner experiences remain in their original projects: Tactical RTIC, Live Chart Desk Watchlist, Sports Center Sector Market Lab and Market Terminal.
- Classroom Market Room appears as a practice workspace, explicitly not a live scanner.
- Six Calculator Pro scanner module folders — Bullish, Bearish, Gap, High Volume, Earnings and Options — currently contain empty placeholder files. They are not operational scanners; the directory labels them as not live.
- No scanner data engine is duplicated in this repo.

## Build boundaries

- Do not display sample quotes or fabricated scan rows as provider data.
- Future modules need a named provider, response validation, timestamps, coverage, failure state and tests before they are labelled operational.
- This page is not a brokerage connection and does not submit orders.

## Branch update

Adds `scanner-hub/index.html`, root Scanner Directory navigation, updates the roadmap card, and preserves the existing calculator modules and user project links. Static Node tests and GitHub Actions checks verify the directory.

**Status:** Pending review and CI. Not merged or deployed.
