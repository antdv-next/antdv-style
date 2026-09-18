# Transformers

## px2remTransformer

Convert pixel values in serialized CSS strings:

```ts
import { px2remTransformer } from 'antdv-style'

const transform = px2remTransformer({
  rootValue: 16,
  precision: 5,
  minPixelValue: 1,
})

transform('padding: 16px; border: 1px solid;')
// padding: 1rem; border: 0.0625rem solid;
```

| Option | Default | Description |
|---|---:|---|
| `rootValue` | `16` | Root font size used for conversion |
| `precision` | `5` | Maximum decimal precision |
| `minPixelValue` | `0` | Pixel values with an absolute magnitude below this threshold are preserved |
| `mediaQuery` | See below | Convert px dimensions in query parameters |

This utility is not automatically connected to Emotion; use it in a custom build or export pipeline.

Conversion uses CSS syntax and handles px dimensions in declaration values and
`@media`, `@supports`, and `@container` parameters, including signed values and
native math functions. URLs, quoted strings, comments, selectors, and property
names are preserved; for example, `url("/icon-16px.png")` and `content: "16px"` are
unchanged. Both stylesheets and declaration fragments are accepted. If CSS parsing
fails, the original input is returned without partial conversion.

The callable result also implements the upstream `visit` interface and can be
passed directly to `StyleProvider.transformers`. Its object visitor delegates to
the official `@antdv-next/cssinjs` implementation, while preserving numeric unitless
properties such as `lineHeight` across native-ESM SSR dependency loaders:

```vue
<script setup lang="ts">
import { px2remTransformer, StyleProvider } from 'antdv-style'

const transformers = [px2remTransformer({ rootValue: 16, mediaQuery: true })]
</script>

<template>
  <StyleProvider :transformers="transformers">
    <App />
  </StyleProvider>
</template>
```

This pipeline transforms antdv-next CSS-in-JS styles, not custom Emotion styles.
It visits numeric/px declarations in registered objects, not token CSS variable
definitions emitted by another pipeline. A font using `var(--ant-font-size)`
does not imply that the variable's px value has also been converted.

For compatibility, the two entry points retain their respective defaults.
The object visitor defaults `mediaQuery` to `false`, preserves 1px borders and
does not use `minPixelValue`. The legacy string call converts query parameters
by default; pass `mediaQuery: false` to preserve them. `minPixelValue` applies
only to the string call.

## legacyLogicalPropertiesTransformer

Re-exported from `@antdv-next/cssinjs` for the antdv-next `StyleProvider` transformer pipeline:

```vue
<script setup lang="ts">
import { legacyLogicalPropertiesTransformer, StyleProvider } from 'antdv-style'
</script>

<template>
  <StyleProvider :transformers="[legacyLogicalPropertiesTransformer]">
    <App />
  </StyleProvider>
</template>
```
