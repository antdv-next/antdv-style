# setupStyled

::: warning Not available in Vue
`setupStyled` belongs to the upstream React styled ecosystem. This package does not export it.
:::

Use [`createInstance`](/en/api/create-instance) to create isolated providers, factories, and composables:

```ts
const style = createInstance({
  key: 'acme',
  prefixCls: 'acme',
  customToken: { brandRadius: 10 },
})
```

You can bridge `useTheme()` into a third-party Vue styled library explicitly, but antdv-style does not guarantee that library's context or SSR behavior.
