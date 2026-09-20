# CSS in JS Primer

CSS-in-JS describes styles in JavaScript or TypeScript and generates CSS at runtime or build time. In Vue applications it can directly consume component props, reactive state, and design tokens.

## Basic forms

antdv-style accepts style objects and template strings:

```ts
const useStyles = createStyles(({ css, token }) => ({
  card: css({ padding: token.paddingLG, color: token.colorText }),
  title: css`color: ${token.colorPrimary};`,
}))
```

Both forms produce class name strings. Object syntax offers stronger typing; template strings feel closer to regular CSS.

## Vue usage

`createStyles` returns a composable. Call it in `setup()` below a `ThemeProvider`:

```vue
<script setup lang="ts">
import { toRefs } from 'vue'
import { createStyles } from 'antdv-style'

const useStyles = createStyles(({ css, token }) => ({
  root: css({ color: token.colorText }),
}))
const { styles } = toRefs(useStyles())
</script>

<template><div :class="styles.root">Hello CSS-in-JS</div></template>
```

Use `createStyles` for theme or prop-dependent styles, `createStaticStyles` for fixed structures driven by CSS variables, and `createGlobalStyle` for document-level selectors.
