# Component Migration from Less

Libraries add two constraints: defaults must remain overridable, and styles must not depend on the host application's singleton context.

## Before and After

The three statistic layouts correspond to the upstream inline, vertical and
horizontal component examples. The first row keeps static CSS; the second reads
theme tokens through Vue `createStyles`. Toggle dark mode to compare them.
This uses Vue components, not React ProComponents.

<MigrationComparisonDemo />

<<< @/.vitepress/theme/components/MigrationComparisonDemo.vue

```ts
export const libraryStyle = createInstance({
  key: 'acme',
  prefixCls: 'acme',
  hashPriority: 'low',
})
```

Use the instance's provider and factories throughout the library. Expose stable root classes or class maps, never Emotion hashes. Prefer tokens as the public visual contract.

Library modules must not access `window` or `document` at import time. Validate ESM output, Vue declarations, SSR rendering, and multiple simultaneous instances before publishing.
