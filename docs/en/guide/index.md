# Introduction

antdv-style is a CSS-in-JS solution for [antdv-next](https://github.com/antdv-next/antdv-next), built on [Emotion](https://emotion.sh/). It provides a seamless way to consume antdv-next's token system in your component styles.

## Why antdv-style?

antdv-next provides a powerful token-based design system with 500+ design variables. antdv-style makes it easy to consume these tokens in your component styles:

- Write styles with full token access and IDE IntelliSense
- Switch between light/dark mode with one prop
- Create reusable style presets with `createStylish`
- Build responsive layouts with token-driven breakpoints
- Isolate styles in micro-frontend scenarios

## Vue Adaptation

antdv-style's API design is adapted for Vue 3:

| React pattern | Vue adaptation |
|---|---|
| `useMemo` / `useContext` | `computed` / `provide` + `inject` |
| Hook returns plain object | Composable returns reactive proxy |
| `<Global>` component | `injectGlobal` + managed `<style>` tag |
| `SerializedStyles` | Class name strings |

