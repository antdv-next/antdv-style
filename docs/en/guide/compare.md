# Comparing Styling Approaches

## Less and CSS Modules

Separate style files are easy to inspect and cheap at runtime, but dynamic tokens and runtime themes require an additional variable layer.

## Inline styles

Vue `:style` is excellent for a few dynamic values, but cannot express pseudo-classes, media queries, keyframes, or selector relationships.

## styled components

Styled APIs work well for strongly encapsulated design systems. This Vue implementation does not ship a React-compatible `styled` or `setupStyled` API.

## createStyles

`createStyles` keeps the CSS Modules mental model while adding Vue props and theme context:

```ts
const useStyles = createStyles<{ active: boolean }>(
  ({ css, token }, props) => ({
    root: css({
      color: props.active ? token.colorPrimary : token.colorText,
      '&:hover': { color: token.colorPrimaryHover },
    }),
  }),
)
```

| Approach | Dynamic theme | Selectors | Vue reactivity | Best for |
|---|---:|---:|---:|---|
| CSS Modules | Via CSS variables | Yes | Indirect | Mostly static styles |
| `:style` | Yes | No | Yes | Small dynamic values |
| `createStaticStyles` | CSS variables | Yes | No | Hot static paths |
| `createStyles` | Yes | Yes | Yes | Default application styling |
