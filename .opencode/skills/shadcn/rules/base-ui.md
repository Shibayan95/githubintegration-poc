# Base UI Patterns

This project uses **Base UI** primitives (`base` in `components.json`). These patterns are specific to Base UI and differ from Radix.

## Contents

- Composition with `render`
- Button / trigger as non-button element (`nativeButton`)
- Select (`items` prop, placeholder, positioning, multiple, object values)
- ToggleGroup (`multiple` boolean, array `defaultValue`)
- Slider (scalar `defaultValue`)
- Accordion (`multiple` boolean, array `defaultValue`)

---

## Composition with `render`

Base UI uses `render` to replace the default element. Do not use `asChild` — that is Radix-only.

**Incorrect:**

```tsx
<DialogTrigger asChild>
  <Button>Open</Button>
</DialogTrigger>
```

**Correct:**

```tsx
<DialogTrigger render={<Button />}>Open</DialogTrigger>
```

This applies to all trigger and close components: `DialogTrigger`, `SheetTrigger`, `AlertDialogTrigger`, `DropdownMenuTrigger`, `PopoverTrigger`, `TooltipTrigger`, `CollapsibleTrigger`, `DialogClose`, `SheetClose`, `NavigationMenuLink`, `BreadcrumbLink`, `SidebarMenuButton`, `Badge`, `Item`.

---

## Button / trigger as non-button element

When `render` changes an element to a non-button (`<a>`, `<span>`, `<InputGroupAddon>`), add `nativeButton={false}`.

**Incorrect:**

```tsx
<Button render={<a href="/docs" />}>Read the docs</Button>
```

**Correct:**

```tsx
<Button render={<a href="/docs" />} nativeButton={false}>
  Read the docs
</Button>
```

Same for triggers whose `render` is not a `Button`:

```tsx
<PopoverTrigger render={<InputGroupAddon />} nativeButton={false}>
  Pick date
</PopoverTrigger>
```

---

## Select

**`items` prop is required.** Base UI `Select` requires an `items` prop on the root.

**Incorrect:**

```tsx
<Select>
  <SelectTrigger><SelectValue placeholder="Select a fruit" /></SelectTrigger>
</Select>
```

**Correct:**

```tsx
const items = [
  { label: "Select a fruit", value: null },
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
]

<Select items={items}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

**Placeholder:** Use a `{ value: null }` item in the items array (not `<SelectValue placeholder="...">`).

**Content positioning:** Use `alignItemWithTrigger` and `side`:

```tsx
<SelectContent alignItemWithTrigger={false} side="bottom">
```

### Multiple selection

```tsx
<Select items={items} multiple defaultValue={[]}>
  <SelectTrigger>
    <SelectValue>
      {(value: string[]) => value.length === 0 ? "Select fruits" : `${value.length} selected`}
    </SelectValue>
  </SelectTrigger>
  ...
</Select>
```

### Object values

```tsx
<Select defaultValue={plans[0]} itemToStringValue={(plan) => plan.name}>
  <SelectTrigger>
    <SelectValue>{(value) => value.name}</SelectValue>
  </SelectTrigger>
  ...
</Select>
```

---

## ToggleGroup

Base UI uses a `multiple` boolean prop (not `type="single"` / `type="multiple"`). `defaultValue` is always an array.

**Incorrect:**

```tsx
<ToggleGroup type="single" defaultValue="daily">
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
</ToggleGroup>
```

**Correct:**

```tsx
// Single selection (no prop needed), defaultValue is always an array.
<ToggleGroup defaultValue={["daily"]} spacing={2}>
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
  <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
</ToggleGroup>

// Multi-selection.
<ToggleGroup multiple>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>
```

**Controlled single value** — wrap/unwrap arrays:

```tsx
const [value, setValue] = React.useState("normal")
<ToggleGroup value={[value]} onValueChange={(v) => setValue(v[0])}>
```

---

## Slider

Base UI accepts a plain number for a single thumb (not an array).

**Incorrect:**

```tsx
<Slider defaultValue={[50]} max={100} step={1} />
```

**Correct:**

```tsx
<Slider defaultValue={50} max={100} step={1} />
```

Both base and radix use arrays for range sliders. Controlled `onValueChange` may need a cast:

```tsx
const [value, setValue] = React.useState([0.3, 0.7])
<Slider value={value} onValueChange={(v) => setValue(v as number[])} />
```

---

## Accordion

Base UI uses no `type` prop. Use `multiple` boolean. `defaultValue` is always an array. No `collapsible` prop needed — accordions are collapsible by default.

**Incorrect:**

```tsx
<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>
```

**Correct:**

```tsx
<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>

// Multi-select.
<Accordion multiple defaultValue={["item-1", "item-2"]}>
  <AccordionItem value="item-1">...</AccordionItem>
  <AccordionItem value="item-2">...</AccordionItem>
</Accordion>
```
