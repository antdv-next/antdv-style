# Styled Ecosystem

<RuntimeCapabilitiesDemo variant="styled" />

The upstream React project documents compatibility with styled libraries. This Vue implementation currently does not ship `styled` or `setupStyled`.

| React pattern | Vue alternative |
|---|---|
| `styled.div` | Vue SFC plus `createStyles` |
| styled props | `createStyles<Props>` plus a props getter |
| `setupStyled` | `createInstance` |
| styled theme context | `ThemeProvider` plus `useTheme` |

Existing Vue styled libraries can consume values from `useTheme()`, but antdv-style cannot guarantee their SSR, cache, or type contracts.
