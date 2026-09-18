# Introduction

`antdv-style` is an application-level CSS-in-JS solution for Vue 3 and [antdv-next](https://github.com/antdv-next/antdv-next). It combines Emotion, antdv-next design tokens, dynamic themes, responsive utilities, and Vue dependency injection behind one API.

## Motivation

antdv-next already provides the token system and the low-level CSS-in-JS engine used by its components. Applications still need conventions for consuming tokens in ordinary Vue components, organizing scoped styles, switching themes, and migrating existing Less code.

antdv-style fills that application layer. It complements rather than replaces `@antdv-next/cssinjs`.

## Features

- Token-aware `createStyles`, `useTheme`, and `useAntdToken` APIs.
- Light, dark, automatic, and custom appearances.
- Reusable Stylish presets.
- CSS media helpers and runtime breakpoint state.
- A static style path for CSS-variable-driven components.
- Isolated instances for libraries, micro-frontends, and Shadow DOM.
- SSR extraction that returns both CSS text and complete style tags.

## Vue Adaptation

| React pattern | Vue adaptation |
|---|---|
| `useMemo` / `useContext` | `computed` / `provide` + `inject` |
| Hook returns plain object | Composable returns reactive proxy |
| `<Global>` component | `createGlobalStyle` + managed `<style>` tag |
| `SerializedStyles` | Class name string |

Continue with the [Quick Start](/en/guide/quick-start) or learn how to [write styles](/en/guide/create-styles).
