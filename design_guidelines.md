# Hospital Temperature Management System - Design Guidelines

## Design Approach: Medical Dashboard System

Selected Approach: **Healthcare Dashboard Design System** inspired by modern medical platforms like Epic, Cerner, and AWS Healthcare dashboards. Prioritizing clarity, accessibility, and information hierarchy for critical healthcare monitoring.

**Key Principles:**
- Medical-grade clarity and precision
- Instant data comprehension
- Role-based visual hierarchy
- Trust through consistency
- Zero ambiguity in critical information.

---

## Typography System

**Font Family:** 
- Primary: 'Inter' or 'IBM Plex Sans' from Google Fonts (excellent readability for data)
- Monospace: 'JetBrains Mono' for temperature values and numerical data

**Hierarchy:**
- Dashboard Headers: text-2xl font-semibold
- Section Titles: text-lg font-medium
- Patient Names: text-base font-medium
- Labels: text-sm font-medium uppercase tracking-wide
- Data Values (Temperature): text-3xl font-mono font-bold
- Metadata: text-sm text-gray-600
- Risk Indicators: text-xs font-semibold uppercase

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 3, 4, 6, and 8** consistently
- Component padding: p-4 or p-6
- Section margins: space-y-6 or space-y-8
- Card gaps: gap-4 or gap-6
- Form field spacing: space-y-3

**Grid System:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Patient list: Full-width table or card grid
- Stat cards: grid-cols-2 md:grid-cols-4 gap-4

---

## Component Library

### Navigation & Layout
**Top Navigation Bar:**
- Fixed header with role badge (Admin/Doctor/Nurse)
- Hospital logo left, user profile right
- Height: h-16 with px-6 horizontal padding
- Shadow: shadow-sm for subtle separation

**Sidebar Navigation (Admin only):**
- Width: w-64 on desktop, collapsible on mobile
- Sections: Dashboard, Patients, Staff, Settings
- Active state: distinct background treatment with left border accent

### Dashboard Components

**Patient Cards:**
- Border with rounded-lg corners
- Padding: p-6
- Shadow: shadow-md for elevation
- Layout: Flex column with patient info top, temperature display center, metadata bottom
- Temperature Display: Large centered numerical value with unit label
- Quick Info: Grid of 2x2 showing Room, Floor, Block, Disease

**Risk Indicator Badge:**
- Positioned top-right of patient card
- Size: px-3 py-1 rounded-full
- Font: text-xs font-bold uppercase
- States clearly distinguished through background treatment (determined by risk level)

**Statistics Cards (Dashboard Overview):**
- Grid of 4 cards showing: Total Patients, Critical Alerts, Normal Range, Warnings
- Each card: p-6 rounded-lg shadow
- Large numerical value with label below
- Icon top-left (from Heroicons)

**Temperature History Chart Area:**
- Container: p-6 rounded-lg shadow-md
- Title bar with patient name and date range
- Chart height: h-64 or h-80
- Placeholder: "Temperature trend visualization area"

### Forms & Inputs

**Patient/Staff Management Forms:**
- Form container: max-w-2xl with p-8
- Input fields: Full-width with border rounded-md
- Label structure: text-sm font-medium mb-2
- Input height: h-10 or h-12 with px-4
- Field spacing: space-y-4
- Section dividers: border-t with mt-8 pt-8

**Threshold Override (Admin):**
- Inline editing layout: Label + Input + Unit side-by-side
- Min/Max inputs: w-24 each with gap-4
- Save/Cancel buttons below: gap-3

### Data Display

**Patient Table (Admin View):**
- Full-width responsive table
- Header: font-medium text-sm uppercase tracking-wide
- Row height: min-h-16 with py-3
- Zebra striping for row distinction
- Action column right-aligned with icon buttons
- Mobile: Stack as cards with gap-3

**Real-time Status Indicators:**
- Dot indicator: w-2 h-2 rounded-full inline-block mr-2
- Pulse animation for live updates
- Status text: text-sm font-medium

### Buttons & Actions

**Primary Actions:**
- Height: h-10 with px-6
- Font: text-sm font-semibold
- Rounded: rounded-md
- Examples: "Add Patient", "Save Changes", "Send Alert"

**Secondary Actions:**
- Border style with same sizing as primary
- Examples: "Cancel", "View Details"

**Icon Buttons:**
- Size: w-10 h-10 flex items-center justify-center
- Rounded: rounded-md
- Examples: Edit, Delete, View icons (Heroicons)

### Alerts & Notifications

**Alert Banner:**
- Full-width with p-4 rounded-md
- Icon left, message center, dismiss right
- Position: Top of dashboard or inline in patient card
- Types: Critical (red tone), Warning (yellow tone), Info (blue tone)

**SMS Notification Log (Optional Section):**
- List layout with space-y-2
- Each item: p-3 rounded border-l-4 (border indicates severity)
- Timestamp right-aligned text-xs
- Recipient and message preview

### Modal Overlays

**Add/Edit Patient Modal:**
- Max width: max-w-3xl
- Padding: p-8
- Background overlay with backdrop blur
- Close button top-right
- Form layout: 2-column grid on desktop, single column mobile

---

## Role-Based Layouts

**Admin Dashboard:**
- Top row: 4 stat cards
- Middle section: Patient grid (3 columns desktop)
- Bottom: Staff management table
- Sidebar: Full navigation access

**Doctor/Nurse Dashboard:**
- Simplified top nav (no sidebar)
- Focus: "My Patients" grid
- Filter bar: By floor, block, or risk level
- Larger patient cards showing more detail

---

## Responsive Breakpoints

- Mobile: Single column, stacked cards
- Tablet (md): 2-column grid
- Desktop (lg+): 3-column grid for patient cards, full table layouts

---

## Icons

Use **Heroicons** (outline style) via CDN:
- User icons for staff
- Heart icon for patient vitals
- Bell icon for alerts
- Chart icon for analytics
- Plus/Edit/Trash for actions
- Check/X for status

---

## Images

No hero images needed (this is a dashboard application). Instead:
- Hospital logo in top navigation (SVG, h-8)
- User avatar placeholders (rounded-full w-10 h-10)
- Optional: Empty state illustrations for "No patients assigned" (simple line art)

---

## Animations

**Minimal, purposeful only:**
- Real-time pulse on live temperature updates
- Smooth transitions on modal open/close (200ms)
- Alert fade-in when new critical temperature detected
- No decorative animations - medical context requires stability

---

## Accessibility

- All form inputs with associated labels
- Color is never the only indicator (icons + text with risk colors)
- Keyboard navigation for all interactive elements
- Focus states clearly visible
- High contrast for critical information
- Screen reader labels for icon-only buttons

---

**Design Priority:** Function over form. Every design decision serves the core purpose: rapid comprehension of patient temperature status and immediate action on critical alerts.