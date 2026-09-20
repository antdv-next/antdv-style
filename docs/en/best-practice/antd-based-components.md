# Building Libraries on antdv-next

Create one library-level style instance:

```ts
export const styling = createInstance({
  key: 'acme',
  prefixCls: 'acme',
  hashPriority: 'low',
})
```

Use `styling.createStyles` internally and export its `ThemeProvider` as an optional library provider. Separate context keys keep host providers from changing internal behavior accidentally.

Treat tokens as the public visual contract, publish stable root classes or class maps, and never document generated Emotion hashes.

Keep `vue`, `antdv-next`, and `antdv-style` as peer dependencies. Validate light/dark themes, custom prefixes, nested providers, SSR, and multiple simultaneous library versions.
