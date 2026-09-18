# useResponsive

Reactive breakpoint state based on `window.matchMedia`.

<ResponsiveDemo />

<ThemeVariantsDemo variant="responsive" />

## Signature

```typescript
function useResponsive(): ResponsiveState
```

Returns a reactive object that updates automatically as the viewport size changes.

## Return Value

```typescript
interface ResponsiveState {
  // Standard breakpoints
  xs: boolean      // max-width  (≤ xsMax — mobile portrait)
  sm: boolean      // min-width  (≥ 576px)
  md: boolean      // min-width  (≥ 768px)
  lg: boolean      // min-width  (≥ 992px)
  xl: boolean      // min-width  (≥ 1200px)
  xxl: boolean     // min-width  (≥ 1600px)

  // Device aliases
  mobile: boolean   // same query as xs
  tablet: boolean   // same query as md
  laptop: boolean   // same query as lg
  desktop: boolean  // same query as xxl
}
```

On a 1024 px wide screen: `xs=false`, `sm=true`, `md=true`, `lg=true`, `xl=false`, `xxl=false`.

## Example

```vue
<script setup>
import { useResponsive } from 'antdv-style'

const responsive = useResponsive()
</script>

<template>
  <div v-if="responsive.mobile">Mobile layout</div>
  <div v-else-if="responsive.lg">Desktop layout</div>
  <div v-else>Tablet layout</div>
</template>
```

## Notes

- Reads `screenXSMax` and `screenSM` through `screenXXL` from the closest antdv-next `ConfigProvider`, including the one inside `ThemeProvider`, and responds to token updates. The values above are defaults.
- Consumers with identical breakpoint configurations share listeners; different configurations remain isolated. Listeners are removed when the final subscriber unmounts.
- Does **not** require `<ThemeProvider>`.
- SSR-safe: breakpoint values default to `false` when `window.matchMedia` is unavailable.
