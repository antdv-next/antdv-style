# CSS Variable Utilities

The proxy returns `var(...)` references; it does not inject declarations. Native
elements must inherit matching variables, for example inside antdv-next's `App`
under a ThemeProvider, or from variables explicitly declared on your container.

The default `cssVar` proxy maps token property names to antdv-next CSS variable references:

```ts
cssVar.colorPrimary // var(--ant-color-primary)
cssVar.screenXSMax  // var(--ant-screen-xs-max)
```

The `cssVar` utility inside `createStyles` follows the current ThemeProvider's
effective variable prefix. The top-level export and static styles do not read
component context. Themes sharing a component prefix but using different variable
prefixes require component hashing; see
[ThemeProvider component style isolation](./theme-provider#component-style-isolation).

`createCSSVarProxy({ prefix: 'acme' })` adds a fallback to the `--ant-*` variable:

```css
var(--acme-color-primary, var(--ant-color-primary))
```

`tokenToCSSVar(token, { prefix })` converts a plain token object into CSS declarations. Private keys, already hyphenated keys, objects, and functions are skipped.
