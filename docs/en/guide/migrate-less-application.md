# Manual Application Migration

<MigrationComparisonDemo />

## Keep the DOM stable

Map every existing Less class to a `createStyles` key first. Change where classes come from without restructuring the template in the same step.

```ts
export const useStyles = createStyles(({ css, token }) => ({
  root: css({ padding: token.paddingLG }),
  title: css({ color: token.colorTextHeading }),
}))
```

Replace hard-coded colors, spacing, type, shadows, and breakpoints with tokens. Put business-specific values in `customToken` instead of maintaining a parallel global Less variable file.

Move resets and root selectors to `createGlobalStyle`. For third-party overrides, check component tokens and `classNames` APIs before preserving a global selector.

Remove Less loaders and injected variables only after the final importer in that directory has migrated.
