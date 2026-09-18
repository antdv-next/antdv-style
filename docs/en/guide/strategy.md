# Design Strategy

## Application-level API

antdv-style targets applications and component libraries built on antdv-next. Low-level component registration remains the job of `@antdv-next/cssinjs`; application styles use the simpler `createStyles` model.

## Tokens are the theme contract

Prefer tokens for color, spacing, radii, typography, shadows, and breakpoints. The same style can then follow theme algorithms, custom tokens, and nested providers.

## Pay for dynamic behavior only when needed

1. Use `createStaticStyles` for constants and CSS variables.
2. Use `createStyles` for themes and props.
3. Use `createStylish` for reusable class fragments.
4. Use `createGlobalStyle` for document-level selectors.

Pass reactive values through a getter:

```ts
import { toRefs } from 'vue'

const { styles } = toRefs(useStyles(() => ({ compact: props.compact })))
```

Avoid recreating style factories during render and avoid large non-serializable style props. The current dynamic style cache derives its key from JSON-serializable theme and prop values.
