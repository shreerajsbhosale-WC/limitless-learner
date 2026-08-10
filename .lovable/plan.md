# Mobile experience pass

On a 390px phone viewport the site currently scrolls sideways (page content measures ~533px wide on the home and study pages), the intro video popup opens automatically and runs off the right edge, and several rows and grids are laid out for desktop only. This plan makes every page behave properly on phones.

## What will change

**Header**
- Compact on phones: logo, the Exam/Music toggles as icon-only buttons, and a single menu button. The "Start studying" button shrinks to fit instead of pushing the row wide.
- The row becomes a two-column grid so long text truncates instead of overflowing.

**Intro video popup**
- Fits inside the screen with side margins, video stays 16:9.
- Chapter chips scroll horizontally in one swipeable row instead of stacking and spilling.
- Controls (play, mute, restart, speed, fullscreen) wrap onto a second line on narrow screens; touch targets enlarged.
- It will no longer auto-open on a phone on first visit; it stays available from the hero button, dashboard banner, and sidebar so it never blocks the first screen.

**Home page**
- Hero heading and body text scale down for small screens; buttons go full-width stacked.
- The tilted dashboard mockup is hidden or flattened on mobile (it is the main cause of sideways scroll).
- Stat/feature grids drop to one column with tighter spacing.

**Study page**
- Upload/Text/Link tab bar and the Notes/Flashcards/Quiz/Match tab bar become scrollable or two-row on narrow screens.
- Page header row stacks; big titles scale down.
- Dropzone, generated notes, flashcards and quiz cards get mobile padding and readable font sizes.

**Dashboard and feature pages (library, habits, focus, weekly, groups, assistant, flowchart)**
- Verify the existing mobile top bar and slide-out sidebar work, and that the sidebar closes after tapping a link.
- Multi-column stat rows collapse to one or two columns; flowchart and charts get horizontal scroll containers instead of squashing.
- Auth/OTP screen: full-width inputs and code boxes sized for phones.

**Lofi player**
- Currently a fixed 280px box pinned bottom-right; on phones it becomes a slim full-width bar above the safe area so it does not cover content or overflow.

**Global**
- Prevent horizontal scrolling app-wide and add safe-area padding for notched phones.
- Minimum 44px tap targets on icon buttons.

## Verification

After the changes I will re-run a phone-sized browser pass over every route and confirm the page width equals the screen width (no sideways scroll) with screenshots.

## Technical notes

- Tailwind-only changes plus small structural tweaks; no backend, data, or AI-prompt changes.
- Multi-item rows use `grid-cols-[minmax(0,1fr)_auto]` with `min-w-0` on text containers and `shrink-0` on icons, promoting to flex at `sm:`/`md:`.
- Tab bars switch from `grid grid-cols-N` to a scrollable flex row on mobile.
- Auto-open of `WelcomeVideo` gated behind a desktop media query in `use-tour`.
