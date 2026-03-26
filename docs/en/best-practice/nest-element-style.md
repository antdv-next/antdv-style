# Parent-Child Cascading Styles

Sometimes you need to change a child element's style when hovering the parent container.

## Demo

<script setup>
import NestElementsDemo from '../../best-practice/demos/NestElementsDemo.vue'
</script>

<NestElementsDemo />

## Core Code

```typescript
const useStyles = createStyles(({ css }) => {
  // 1. Use css`` to generate a child class name
  const child = css`
    background: #ff4d4f;
    width: 100px;
    height: 100px;
  `

  return {
    // 2. Use css() function call (not tagged template!) for parent,
    //    so ${child} is interpolated as a plain selector string
    parent: css(`
      cursor: pointer;

      &:hover .${child} {
        background: #1677ff;
      }
    `),
    child,
  }
})
```

::: warning
Use `css()` **function call** (not `` css`...` `` tagged template) when interpolating class names as selectors. Tagged templates cause Emotion to treat the interpolation as style composition instead of a literal string.
:::

## How It Works

1. `css` `` ` `` returns a class name string (e.g. `acss-abc123`)
2. `css()` function call with a regular template string treats `${child}` as a plain string interpolation
3. The generated CSS rule: `.parent:hover .acss-abc123 { background: #1677ff }`

## Usage in Template

```vue
<template>
  <div :class="s.styles.parent">
    <div :class="s.styles.child" />
    <span>hover to change color</span>
  </div>
</template>
```
