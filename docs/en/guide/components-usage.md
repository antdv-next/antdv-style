# Component Library Development

<AntdOverrideDemo />

<RuntimeCapabilitiesDemo variant="instance" />

Libraries must balance isolation, overridability, and multi-instance support.

## Low-specificity defaults

Create a dedicated instance with low hash priority so consumers can override defaults:

```ts
export const componentStyle = createInstance({
  key: 'my-lib',
  prefixCls: 'my-lib',
  hashPriority: 'low',
})
```

Export this instance's `ThemeProvider` and `createStyles` for internal library use. Separate context keys prevent collisions with the host application.

## Public class contracts

Expose `class`, `rootClassName`, or a `classNames` map and combine values with `cx`. Never expose Emotion hashes as a stable API.

## Theme overrides

Prefer antdv-next component tokens. Use scoped selectors only for details that the component API cannot represent.

For Shadow DOM and micro-frontends, set the insertion `container` on `createInstance` or `StyleProvider` so both Emotion and antdv-next styles land in the intended root.
