# createStaticStyles

Generate static classes once when the module evaluates. Use it for styles that depend only on constants, CSS variables, and fixed media queries.

<StaticStylesDemo />

<ResponsiveStylesDemo static />

## Signature

```ts
function createStaticStyles<T extends StaticStylesInput>(
  factoryOrStyles: StaticStyleFactory<T> | T,
): StaticStylesResult<T>
```

Object input returns a compatibility callable decorated with direct class properties:

```ts
const styles = createStaticStyles(({ cssVar, responsive }) => ({
  container: {
    display: 'grid',
    gap: 16,
    color: cssVar.colorText,
    [responsive.mobile]: { gap: 8 },
  },
  hidden: { display: 'none' },
}))

styles.container // acss-...

// Compatibility with composable-style consumers
const { styles: classMap, cx } = styles()
```

Prefer direct `styles.container` access. The callable shape preserves existing `const { styles } = useStyles()` integrations.

## Factory utilities

| Property | Type | Description |
|---|---|---|
| `css` | `CssUtil` | Generate one class |
| `cx` | `ClassNamesUtil` | Merge classes |
| `cssVar` | `Record<string, string>` | CSS variable proxy |
| `responsive` | `ResponsiveHelpers` | Fixed media query map |

There is no `token`, appearance state, or props because this API does not enter Vue setup and does not react to JavaScript theme state.

`cssVar` creates references, not declarations. Native elements using those references
must inherit the matching variables. The demo uses
`<ThemeProvider><App>...</App></ThemeProvider>` for the theme and antdv-next's DOM
variable scope; explicitly defining variables on your own container also works.

## Custom static instances

`createStaticStylesFactory` configures the variable prefix, hash priority, and Emotion cache. The default cache is also exported as `staticStylesCache` for SSR and custom extraction.
