# UI Patterns Knowledge Base (RAG Source)

This document is intentionally written in chunk-friendly sections. Each pattern is described with practical layout semantics, Tailwind CSS class suggestions, responsive behavior, and an accessibility note so embedding + similarity search can retrieve the right component for queries like “login form”, “navbar”, “sidebar layout”, “pricing table”, or “data table with pagination”.

## Top navigation bar

**When to use:** Use this top app bar / navbar for primary site navigation where users need quick access to key pages and a prominent call-to-action (CTA) like “Sign up” or “Get started”. It works well for marketing sites and product dashboards that need a consistent header across routes.

**Layout structure:**
The header spans the full width at the top. Inside, a left section contains the logo (usually a link to home). The center contains the nav links laid out horizontally with equal spacing. The right section contains a primary CTA button. On mobile, the center links collapse into a hamburger icon; tapping it reveals a dropdown panel that lists nav links vertically and includes the CTA.

**Tailwind classes:**
- Container: `sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur`
- Inner row: `mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6`
- Logo link: `flex items-center gap-2 text-base font-semibold text-gray-900`
- Center nav (desktop): `hidden items-center gap-6 md:flex`
- Nav link: `text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
- CTA button: `hidden rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 md:inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
- Mobile menu button: `inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
- Mobile dropdown: `md:hidden border-t border-gray-200 bg-white px-4 py-3`

**Responsiveness:** On `md` and up, show the horizontal nav links and CTA; below `md`, hide them and show a hamburger button. The dropdown can be rendered conditionally and should take full width with vertical spacing (`space-y-2`).

**Accessibility note:** Wrap the header navigation in a `<nav aria-label="Primary">` and ensure the hamburger button has `aria-expanded` and `aria-controls` pointing to the dropdown panel id.

## Full-width hero section

**When to use:** Use a hero section at the top of a landing page to communicate the product’s value proposition and drive one or two primary actions. It’s ideal for first-impression pages where clarity and scannability matter.

**Layout structure:**
A full-width section with generous vertical padding. In the center, a large heading sits above a supporting subheading paragraph. Below the text, two CTA buttons appear side by side (primary + secondary). The background can be a solid color, a subtle gradient, or an image; if using an image, place a semi-transparent overlay behind the text to keep contrast high.

**Tailwind classes:**
- Container: `relative w-full overflow-hidden`
- Background (solid): `bg-gray-50`
- Background image wrapper: `absolute inset-0 bg-center bg-cover`
- Overlay: `absolute inset-0 bg-gray-900/40`
- Content wrapper: `relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6`
- Heading: `text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl`
- Subheading: `mt-4 max-w-2xl text-pretty text-base text-gray-600 sm:text-lg`
- Buttons row: `mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center`
- Primary button: `inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
- Secondary button: `inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`

**Responsiveness:** Stack buttons vertically on mobile (`flex-col`) and switch to side-by-side at `sm`. Scale typography up at `sm`/`lg` and keep text width constrained for readability.

**Accessibility note:** If using a decorative background image, do not add it as an `<img>`; use CSS background or mark an `<img>` as `alt=""` so screen readers focus on the hero content.

## Two-column sidebar layout

**When to use:** Use a two-column app shell for dashboards, admin panels, documentation, or settings where navigation is persistent and content changes on the right. It’s the standard “sidebar + main content” layout for multi-section products.

**Layout structure:**
The page is a full-height container split into two columns. The left sidebar has a fixed width and contains a vertical list of navigation links (optionally grouped by section). The right column is the main content area and should be independently scrollable so the sidebar remains visible. Active navigation state is indicated with a background tint and a left border or accent ring.

**Tailwind classes:**
- Page shell: `min-h-screen bg-gray-50`
- Grid: `mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[260px_1fr]`
- Sidebar: `border-r border-gray-200 bg-white px-4 py-6`
- Sidebar title: `text-xs font-semibold uppercase tracking-wide text-gray-500`
- Nav list: `mt-3 space-y-1`
- Nav link (default): `flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
- Nav link (active): `flex items-center rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200`
- Main content: `min-h-[calc(100vh-0px)] px-4 py-6 sm:px-6 overflow-y-auto`

**Responsiveness:** On mobile, collapse to a single column with the sidebar rendered above content or behind a toggleable drawer. Switch to a fixed-width sidebar at `md`.

**Accessibility note:** Use semantic landmarks: `<aside>` for the sidebar and `<main>` for content; indicate the current page with `aria-current="page"` on the active nav link.

## Responsive card grid

**When to use:** Use a card grid for showcasing a set of items like blog posts, features, templates, projects, or products where each item has an image thumbnail, title, and short description. It’s a strong pattern for discovery and browsing.

**Layout structure:**
A responsive grid container holds multiple cards with consistent height and spacing. Each card has an image at the top (fixed aspect ratio), followed by a padded body containing a title, short description, and a link (often “Read more” or “View”). The whole card can be clickable, or only the link can be interactive.

**Tailwind classes:**
- Grid container: `mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3`
- Card: `group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow`
- Media wrapper: `aspect-[16/9] w-full overflow-hidden bg-gray-100`
- Image: `h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]`
- Body: `p-5`
- Title: `text-base font-semibold text-gray-900`
- Description: `mt-2 text-sm text-gray-600`
- Link row: `mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`

**Responsiveness:** Use `grid-cols-1` on mobile, switch to 2 columns at `md`, and 3 columns at `lg`. Keep images responsive with `object-cover` and a consistent aspect ratio.

**Accessibility note:** If the entire card is clickable, avoid nested interactive elements; use a single `<a>` that wraps the card content and provide a clear, descriptive link text.

## Login / sign-in form

**When to use:** Use this authentication pattern when users need to sign in with email and password. It’s appropriate for SaaS apps, admin dashboards, and any gated experience where a centered, distraction-free layout improves completion rates.

**Layout structure:**
The page is centered both vertically (optional) and horizontally. A max-width card contains a title (“Sign in”), optional helper text, then a form with an email input, password input, a “Forgot password?” link aligned to the right of the password label row, and a full-width submit button. Below the button, you can optionally add a secondary link to registration.

**Tailwind classes:**
- Page container: `min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12`
- Card: `w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm`
- Title: `text-xl font-semibold text-gray-900`
- Helper text: `mt-2 text-sm text-gray-600`
- Form: `mt-6 space-y-4`
- Label row: `flex items-center justify-between`
- Label: `block text-sm font-medium text-gray-700`
- Input: `mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`
- Forgot link: `text-sm font-medium text-indigo-600 hover:text-indigo-700`
- Submit button: `w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`

**Responsiveness:** The layout remains single-column; ensure comfortable padding on small screens (`px-4`) and keep the card max width (`max-w-md`) so it doesn’t become too wide on desktop.

**Accessibility note:** Use `<label htmlFor>` for each input, set `autoComplete="email"` and `autoComplete="current-password"`, and provide inline error text with `aria-describedby` when validation fails.

## Registration / sign-up form

**When to use:** Use this sign-up pattern when onboarding new users with multiple required fields and legal consent (terms checkbox). It’s ideal for SaaS trials, account creation flows, and membership sites.

**Layout structure:**
Centered page container with a max-width card similar to the login screen. The form fields include full name, email, password, confirm password, a terms acceptance checkbox, and a submit button. On desktop, the name + email can be placed in a two-column grid while password fields remain stacked (or also two-column). On mobile, everything collapses to a single column.

**Tailwind classes:**
- Page container: `min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12`
- Card: `w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm`
- Title: `text-xl font-semibold text-gray-900`
- Form: `mt-6 space-y-5`
- Field grid: `grid grid-cols-1 gap-4 md:grid-cols-2`
- Full-width field wrapper: `md:col-span-2`
- Label: `block text-sm font-medium text-gray-700`
- Input: `mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`
- Checkbox row: `flex items-start gap-3`
- Checkbox: `mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500`
- Terms text: `text-sm text-gray-600`
- Submit button: `w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`

**Responsiveness:** Use `md:grid-cols-2` to create a two-column layout on desktop while staying single-column on mobile. Keep the submit button full width at all sizes for clarity.

**Accessibility note:** Make the terms checkbox label clickable by wrapping the text in a `<label>` tied to the checkbox id, and ensure the checkbox has a clear, specific label like “Agree to Terms of Service”.

## Modal / dialog overlay

**When to use:** Use a modal dialog for short, interruptive tasks like confirming destructive actions, editing a small form, or showing critical information that requires acknowledgment. It’s best when the user should not interact with the underlying page until the dialog is closed.

**Layout structure:**
When open, a full-screen fixed overlay appears with a dark semi-transparent backdrop. Centered on the screen is a white card containing a title, body text (or form controls), and action buttons aligned to the right (typically “Cancel” and “Confirm”). A close (X) icon button sits in the top-right corner of the card for quick dismissal.

**Tailwind classes:**
- Overlay root: `fixed inset-0 z-50 flex items-center justify-center`
- Backdrop: `absolute inset-0 bg-gray-900/60`
- Dialog panel: `relative w-full max-w-lg rounded-xl bg-white p-6 shadow-lg`
- Title: `text-lg font-semibold text-gray-900`
- Body: `mt-2 text-sm text-gray-600`
- Close button: `absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
- Footer row: `mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end`
- Cancel button: `inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50`
- Confirm button: `inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700`

**Responsiveness:** On small screens, allow the dialog to take near-full width with padding (`px-4` on the page) and stack the buttons vertically (`flex-col-reverse`) switching to right-aligned horizontal buttons at `sm`.

**Accessibility note:** Implement proper dialog semantics with `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` referencing the title; trap focus within the modal while open and return focus to the trigger on close.

## Pricing table

**When to use:** Use a pricing table on marketing pages to compare subscription tiers and guide users toward a recommended plan. This pattern is effective when you have a small number of plans (commonly three) with a clear “most popular” middle tier.

**Layout structure:**
A section with a heading and optional intro text. Below, three tier cards (Free, Pro, Enterprise) are displayed in a responsive grid. Each card contains the plan name, price, a short description, a CTA button, and a feature list with checkmarks. The Pro card is visually highlighted using an accent ring, slightly stronger shadow, and a “Most popular” badge.

**Tailwind classes:**
- Section: `bg-white px-4 py-16 sm:px-6`
- Wrapper: `mx-auto max-w-6xl`
- Header: `text-center`
- Grid: `mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3`
- Tier card: `rounded-xl border border-gray-200 bg-white p-6 shadow-sm`
- Highlighted tier card (Pro): `rounded-xl border border-indigo-200 bg-white p-6 shadow-md ring-2 ring-indigo-500`
- Badge: `inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700`
- Price: `mt-4 text-4xl font-bold text-gray-900`
- CTA button (primary): `mt-6 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700`
- CTA button (secondary): `mt-6 w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50`
- Feature list: `mt-6 space-y-3`
- Feature item: `flex items-start gap-3 text-sm text-gray-700`
- Checkmark icon wrapper: `mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-green-50 text-green-700`

**Responsiveness:** Stack cards in one column on mobile and switch to three columns at `lg`. Keep CTA buttons full width and ensure the highlighted plan remains visually distinct without relying only on color.

**Accessibility note:** Use lists for features (`<ul>` / `<li>`) and ensure the “Most popular” badge text is included in the DOM (not just a visual indicator) so assistive tech can perceive the recommendation.

## Dashboard with stat cards

**When to use:** Use a metrics dashboard header to provide a quick snapshot of key KPIs (revenue, active users, conversion, churn). It’s most effective at the top of a dashboard page where users expect at-a-glance insight.

**Layout structure:**
At the top of the page, a row (or grid) of four stat cards displays summary metrics. Each card contains a small icon, a large number, a label, and a trend indicator (e.g., “+12%” with up/down arrow and subdued helper text like “vs last week”). Cards should have consistent padding and align content vertically.

**Tailwind classes:**
- Section wrapper: `mx-auto max-w-6xl px-4 py-8 sm:px-6`
- Grid: `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4`
- Card: `rounded-xl border border-gray-200 bg-white p-5 shadow-sm`
- Top row: `flex items-center justify-between`
- Icon chip: `inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700`
- Label: `mt-3 text-sm font-medium text-gray-600`
- Value: `mt-1 text-2xl font-semibold text-gray-900`
- Trend row: `mt-2 flex items-center gap-2 text-sm`
- Trend positive: `font-semibold text-green-700`
- Trend negative: `font-semibold text-red-700`
- Trend helper: `text-gray-500`

**Responsiveness:** Use a 1-column stack on mobile, 2 columns at `sm`, and 4 columns at `lg`. Ensure cards remain readable by keeping values large and truncating long labels.

**Accessibility note:** If the icon is decorative, mark it `aria-hidden="true"`; for trend indicators, include readable text like “up 12 percent” instead of relying only on arrows or color.

## Data table

**When to use:** Use a data table for dense, structured datasets where users need to scan rows and compare columns (e.g., users, orders, invoices). It’s appropriate when sorting, pagination, and row-level actions are common.

**Layout structure:**
The table sits inside a bordered container with optional header controls. Column headers appear at the top, with striped rows for scanability. Each row contains data cells and an actions cell on the far right with “Edit” and “Delete” buttons (often icon + text). Pagination controls sit at the bottom, typically aligned right, with previous/next and page numbers.

**Tailwind classes:**
- Container: `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm`
- Table: `min-w-full divide-y divide-gray-200`
- Thead: `bg-gray-50`
- Th: `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600`
- Tbody: `divide-y divide-gray-200`
- Tr (striped): `odd:bg-white even:bg-gray-50`
- Td: `px-4 py-3 text-sm text-gray-700`
- Actions cell: `px-4 py-3 text-sm text-gray-700 whitespace-nowrap`
- Action button (edit): `inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50`
- Action button (delete): `ml-2 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50`
- Pagination bar: `flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-3`
- Pagination buttons: `inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50`

**Responsiveness:** Wrap the table in `overflow-x-auto` on small screens to allow horizontal scrolling, or use responsive column hiding at breakpoints. Keep actions accessible by preventing wrapping (`whitespace-nowrap`).

**Accessibility note:** Use proper table semantics (`<table>`, `<thead>`, `<th scope="col">`, `<tbody>`) and ensure action buttons have clear labels (e.g., `aria-label="Edit invoice 1024"`).

## Profile / settings page

**When to use:** Use this settings layout for user profile management where multiple settings sections exist (profile, security, notifications, billing). A sidebar makes it easy to navigate between settings pages while keeping content organized.

**Layout structure:**
A two-column layout: a left settings sidebar with menu items and a right content area with forms. The right side includes an avatar upload area (image preview + upload button), followed by a profile form (name, email) and a separate password change section with current/new password fields. Sections are separated with headings and subtle dividers.

**Tailwind classes:**
- Page shell: `min-h-screen bg-gray-50`
- Wrapper: `mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 md:grid-cols-[240px_1fr]`
- Sidebar: `rounded-xl border border-gray-200 bg-white p-4`
- Sidebar item: `flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50`
- Sidebar item (active): `flex w-full items-center rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200`
- Content card: `rounded-xl border border-gray-200 bg-white p-6 shadow-sm`
- Section title: `text-base font-semibold text-gray-900`
- Divider: `my-6 border-t border-gray-200`
- Avatar row: `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`
- Avatar image: `h-16 w-16 rounded-full object-cover ring-1 ring-gray-200`
- Upload button: `inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50`
- Input: `mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`

**Responsiveness:** Collapse to a single column on mobile with the sidebar above the content. Keep forms full width, and ensure the avatar row stacks vertically on smaller screens.

**Accessibility note:** For avatar upload, use a real `<input type="file">` with an associated label; announce upload errors via a live region (`aria-live="polite"`) if validation fails.

## Landing page footer

**When to use:** Use a footer on landing pages and marketing sites to provide secondary navigation, brand reinforcement, and social links. It’s especially useful as a consistent end-of-page destination for users who scroll.

**Layout structure:**
The footer contains a top area with three columns: (1) logo + short tagline, (2) navigation links grouped as a list, and (3) social icons linking to external profiles. Below that is a bottom bar separated by a border that contains copyright text (and optionally secondary links).

**Tailwind classes:**
- Footer container: `border-t border-gray-200 bg-white`
- Top grid wrapper: `mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-3`
- Logo + tagline: `space-y-3`
- Tagline: `text-sm text-gray-600`
- Links column: `space-y-3`
- Links list: `space-y-2`
- Footer link: `text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
- Social row: `flex items-center gap-4`
- Social icon button: `inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
- Bottom bar: `border-t border-gray-200`
- Bottom bar inner: `mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-gray-500 sm:px-6 sm:flex-row sm:items-center sm:justify-between`

**Responsiveness:** Stack columns on mobile and switch to a three-column layout at `md`. In the bottom bar, stack text vertically on small screens and align horizontally at `sm`.

**Accessibility note:** For social links, include accessible names (e.g., visually hidden text “Twitter” / “GitHub”) or `aria-label` on the `<a>` so icon-only controls are understandable to screen readers.
