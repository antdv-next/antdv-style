# Extending Custom Token Types

TypeScript module augmentation lets `customToken`, `useTheme`, and `createStyles` share application token types.

```ts
// src/types/antdv-style.d.ts
import 'antdv-style'

declare module 'antdv-style' {
  interface CustomToken {
    brandGradient: string
    sidebarWidth: number
  }

  interface CustomStylish {
    focusRing: string
  }
}
```

Make sure the declaration file is included by `tsconfig.json`, then provide values through `ThemeProvider.customToken` and `customStylish`.

Custom tokens merge into `Theme`; custom Stylish entries merge into `theme.stylish`. Nested providers inherit parent custom tokens and override matching keys locally.
