# Components (AppGen) — shadcn/ui

**Before using raw HTML** for tables, dialogs, dropdowns, or any element that has a shadcn equivalent in `src/components/ui/`, use that component. Check the directory first.

## UI Components

- **Add via CLI**: `bunx shadcn@latest add <component>`. For prompt-kit: `bunx shadcn@latest add "https://prompt-kit.com/c/<name>.json"`. Always use `bunx`, never `npx`.
- **Import**: Named exports from `@/components/ui/<name>`.
- **Styling**: Tailwind + `cn()` from `@/lib/utils`. Use CSS variables (`bg-background`, `text-foreground`, etc.) for dark mode consistency. No custom CSS files unless necessary.
- **Icons**: `@tabler/icons-react`.
- **Primitives**: Base UI (`@base-ui/react`). Do not edit primitives in `src/components/ui/` — extend via `className` or wrapper components.
- **No ghost props**: Check component source for actual props. Do not invent `loading`, `asChild`, etc. unless the source has them.

## Table

Use shadcn `Table` for all tabular data:

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>ID</TableHead>
      <TableHead>Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.id}</TableCell>
        <TableCell>{row.name}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Forms (`@tanstack/react-form`)

Use **`@tanstack/react-form`** only. No `react-hook-form` or `formik`.

Per-field `validators` take Zod directly via `onChange`/`onBlur`. **Do not** import `zodValidator` or pass `validatorAdapter` — older API, causes runtime errors.

```tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateUserForm({ onSubmit }: { onSubmit: (v: { name: string; email: string }) => void }) {
  const form = useForm({
    defaultValues: { name: "", email: "" },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field
        name="email"
        validators={{ onChange: z.string().email("Valid email required") }}
      >
        {(f) => (
          <div>
            <Input
              value={f.state.value}
              onChange={(e) => f.handleChange(e.target.value)}
              onBlur={f.handleBlur}
            />
            {f.state.meta.errors?.[0] && (
              <p className="text-destructive text-sm">{f.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>
      <Button type="submit">Save</Button>
    </form>
  );
}
```

### Gotchas

- **Select null**: `@base-ui/react` Select does not accept `null` as `value`. Use `""` (empty string) for "nothing selected" and coerce on submit.
- **`asChild`**: Not every shadcn/Base UI component supports it. Check `src/components/ui/<name>.tsx` for `Slot`/`asChild` in props before using. If absent, wrap with your own element instead.

## Layout

The app shell is `AppLayout` → `AppSidebar` + `AppHeader`. Authenticated pages are auto-wrapped by `__root.tsx`.

- **Do not manually wrap pages** in `<AppLayout>`.
- **Add a page**: (1) create `src/routes/<name>.tsx` with `createFileRoute`, (2) add to `routes` array in `src/components/layout/index.ts`. Breadcrumb auto-reads `title`.
- **Branding**: Import `APP_NAME`/`APP_DESCRIPTION` from `@/lib/constants`. Never hardcode.
- **Flush layout**: Wrap route root with `data-flush` to remove content padding (`p-0`, `overflow-hidden`). Use for full-page chat, full-bleed dashboards.

## Chat Assistant

```tsx
<ChatAssistant workflowId={id} />
```

One component, one required prop. Handles messages, sessions, history, Markdown, typing indicator automatically.

| Prop | Type | Default | Description |
|---|---|---|---|
| `workflowId` | `string` | **required** | Workflow to connect to |
| `name` | `string?` | workflow `card_title` → `"Assistant"` | Header title |
| `assistantName` | `string?` | workflow `responder_name` → `name` | Per-message label |
| `fullPage` | `boolean?` | `false` | Edge-to-edge, no border |
| `emptyMessage` | `string?` | workflow `welcome_message` → default | Empty state text |

- **No `workflowId`?** Ask the user — never guess or hardcode.
- **Full-page chat**: `<div data-flush className="h-full"><ChatAssistant workflowId={id} fullPage /></div>`

Chat building blocks in `src/components/chat/`:
- **`ChatAssistant`** — full chat UI (messages, input, history panel, typing indicator)
- **`MessageBubble`** — single message row. Props: `message`, optional `assistantName`, `chatbotAvatar`
- **`ChatMarkdown`** — Markdown renderer via prompt-kit

Prompt-kit components in `src/components/ui/`: `chat-container`, `markdown`, `code-block`, `scroll-button`, `loader`.

## Component Categories (reference)

**Layout:** card, separator, tabs, accordion, collapsible, sheet, sidebar, resizable, aspect-ratio, item
**Forms:** button, button-group, input, input-group, input-otp, textarea, select, native-select, checkbox, radio-group, switch, slider, calendar, field, label, toggle, toggle-group, combobox
**Feedback:** alert, alert-dialog, toast (sonner), skeleton, progress, spinner, loader, empty
**Overlays:** dialog, drawer, popover, tooltip, dropdown-menu, context-menu, hover-card, menubar
**Data:** table, badge, avatar, chart
**Navigation:** breadcrumb, navigation-menu, pagination
**Chat / prompt-kit:** chat-container, markdown, code-block, scroll-button, loader
**Other:** command (cmdk), carousel, scroll-area, direction, kbd
