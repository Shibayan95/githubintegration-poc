---
name: frontend-design
description: Design and implement production-grade enterprise data application interfaces. Use this skill when building components, pages, dashboards, forms, or data tables for an enterprise platform. Produces clean, functional, data-dense UIs that follow the project's existing design system.
---

This skill guides the creation of enterprise-grade frontend interfaces for data platform applications. The goal is clarity, information density, and functional elegance — not visual novelty.

The user provides a feature or screen to build: a dashboard, a data table, a form, a settings panel, a connector view, etc. They may include context about the data being shown or the workflow being supported.

## Design Thinking

Before writing any code, answer these questions:

- **What data is the user looking at?** Tables, metrics, statuses, relationships?
- **What actions do they take?** Filter, sort, create, edit, delete, run, configure?
- **What is the information hierarchy?** What's most important on first glance? What's secondary?
- **What state does the page have?** Loading, empty, error, populated?

Choose the right component composition for the answer. A list of records → `Table`. A summary of metrics → `Card` grid. A configuration task → a `Form` in a `Card` or `Sheet`. A drill-down → `Tabs` within a page.

**CRITICAL**: Enterprise design is about making data legible and tasks efficient. A well-designed enterprise screen shows the right data at the right density with zero visual friction. It does not try to be memorable, stylish, or distinctive.

## Design System

This project uses a Tailwind-palette design system defined in `src/styles.css`: Neutral for base surfaces/text, Indigo for the primary/theme and chart colors, with full light/dark mode via `.dark`. **Extend it — do not replace it.**

### Colors — semantic tokens only

Every color must come from the design system:

```
bg-background       — page background
bg-card             — card / panel surface
bg-muted            — subtle background for secondary sections
bg-primary          — primary action color
bg-secondary        — secondary surface
bg-destructive      — error / destructive actions
text-foreground     — primary body text
text-muted-foreground — captions, labels, secondary text
text-primary-foreground — text on primary background
border-border       — default border
ring-ring           — focus rings
```

**Never use raw Tailwind colors** (`bg-blue-500`, `text-gray-600`, `text-white`, `bg-slate-100`). If you need a shade lighter or darker, check whether `bg-muted` or `bg-accent` already provides it.

### Typography

- **Font**: Google Sans Flex (`font-sans`) is the project font. It is already loaded. Do not import other fonts.
- **Scale**:
  - Page title: `text-2xl font-semibold tracking-tight`
  - Section header: `text-lg font-medium`
  - Card title: `text-base font-medium`
  - Body: `text-sm` with `leading-relaxed` for multi-line content
  - Caption / metadata: `text-xs text-muted-foreground`
- **Minimum sizes**: 14px (`text-sm`) for readable content, 12px (`text-xs`) for captions only.
- **Never** use decorative, serif, display, or monospace fonts for UI text.

### Spacing

- Use the Tailwind 4px scale: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px).
- Never use arbitrary values like `p-[14px]` or `mt-[22px]`.
- Use `gap-*` for spacing between items in flex/grid. Never use `space-x-*` or `space-y-*`.
- Card content padding: `p-4` or `p-6`. Page-level padding: handled by `AppLayout`.

### Layout

- **Desktop-primary**: Design for 1280px+ first. Enterprise users are on desktops.
- **Method priority**: Flexbox (`flex`) for most layouts → CSS Grid (`grid`) for 2D card grids → never float, never absolute unless unavoidable.
- **Dashboard grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- **Sidebar + content**: Already provided by `AppLayout`. Do not re-implement.
- **Content area**: Use `max-w-screen-xl` on the inner container if the content should not stretch to full width.

## Component Patterns

Use these patterns for common enterprise screens. Always use shadcn components — never raw HTML elements.

### Data table

```tsx
<Card>
  <CardHeader>
    <CardTitle>Records</CardTitle>
    <CardDescription>All items from the connector.</CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell><Badge variant="secondary">{row.status}</Badge></TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">Edit</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### Metric cards (dashboard summary)

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>Total Records</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">1,284</p>
      <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
    </CardContent>
  </Card>
</div>
```

### Forms

```tsx
<Card>
  <CardHeader>
    <CardTitle>Configure Source</CardTitle>
  </CardHeader>
  <CardContent>
    <FieldGroup>
      <Field>
        <FieldLabel>Database URL</FieldLabel>
        <Input placeholder="postgres://..." />
      </Field>
      <Field>
        <FieldLabel>Schema</FieldLabel>
        <Input placeholder="public" />
      </Field>
    </FieldGroup>
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### Loading states

Use `Skeleton` for loading placeholders, never custom `animate-pulse` divs:

```tsx
{isLoading ? (
  <div className="flex flex-col gap-3">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-3/4" />
  </div>
) : (
  <Table>...</Table>
)}
```

### Empty states

Use the `Empty` component, not custom markup:

```tsx
<Empty>
  <EmptyTitle>No connectors found</EmptyTitle>
  <EmptyDescription>Add a connector to get started.</EmptyDescription>
  <Button>Add Connector</Button>
</Empty>
```

### Status indicators

Use `Badge` variants, not custom colored spans:

```tsx
<Badge variant="default">Active</Badge>       // primary color
<Badge variant="secondary">Pending</Badge>    // muted
<Badge variant="destructive">Failed</Badge>   // red/error
<Badge variant="outline">Draft</Badge>        // outlined
```

## Motion and Interaction

Enterprise motion is functional, not decorative:

- **Hover**: 150ms ease-out transition on background color (`transition-colors`). Apply to buttons and interactive rows.
- **Loading**: `Skeleton` pulse (built-in), `Spinner` rotation (built-in).
- **Toast**: sonner slide-in (built-in).
- **Page transitions**: none — instant navigation is appropriate.
- **Dialogs/Sheets**: shadcn's built-in 150ms fade/slide is sufficient.

**Never add**: staggered entrance animations, scroll-triggered reveals, parallax effects, element float animations, or any animation that delays the user from seeing content.

## Anti-Patterns (Never Do)

These patterns produce the wrong output for an enterprise platform:

- **No gradients** on cards, buttons, or backgrounds. Charts may use gradient fills.
- **No decorative blobs**, abstract shapes, noise textures, grain overlays, or glassmorphism effects.
- **No hero sections**, large banner images, testimonials, feature grids, or marketing-page patterns.
- **No consumer SaaS aesthetics**: dark purple gradients, neon accents, large oversized typography, centered landing layouts.
- **No raw Tailwind colors** in className. Always semantic tokens.
- **No emoji** as icons or decorative elements. Always Lucide icons from `lucide-react`.
- **No inline `style` prop** unless Tailwind cannot express the value.
- **No decorative fonts**, display fonts, or multiple font families. Google Sans Flex only.
- **No oversized whitespace**: enterprise screens should feel informative, not sparse.
- **No animations** beyond the functional motion listed above.

## Implementation Checklist

Before considering a screen done:

- [ ] All colors use semantic tokens (`bg-*`, `text-*`, `border-*`) — no raw values
- [ ] All interactive elements have hover states via `transition-colors`
- [ ] Loading state handled with `Skeleton` or `Spinner`
- [ ] Empty state handled with `Empty` component
- [ ] Error state surfaces as `toast.error()` or `Alert` variant `destructive`
- [ ] All table data uses shadcn `Table` — no raw `<table>`
- [ ] All forms use `FieldGroup` + `Field` — no raw `div` + `label` + `input`
- [ ] Status values use `Badge` — no custom colored spans
- [ ] Icons from `lucide-react` — no emoji, no other icon libraries
- [ ] TypeScript strict — no `any`, all data shapes typed from `src/services/`
- [ ] No hardcoded strings for app name (`APP_NAME` from `@/lib/constants`)
