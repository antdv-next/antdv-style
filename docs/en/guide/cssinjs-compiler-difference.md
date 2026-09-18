# CSS-in-JS and Less Compiler Differences

Less evaluates files and variables at build time. `createStyles` evaluates style factories at runtime from themes and props, while `createStaticStyles` generates classes once when its module executes.

```ts
css({ color: token.colorPrimary }) // runtime token value
css({ color: cssVar.colorPrimary }) // browser-resolved CSS variable
```

Emotion supports nested objects and `&`, but does not execute Less mixins or functions. Convert reusable mixins to TypeScript functions or Stylish presets.

Emotion adds `px` to most numeric dimensional properties while keeping unitless properties unitless. Review line height, font weight, opacity, z-index, and calculated values during migration.

Runtime CSS-in-JS also needs server-side extraction for SSR. See [SSR Integration](/en/guide/ssr).
