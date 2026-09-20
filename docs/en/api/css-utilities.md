# css / cx / keyframes / injectGlobal

The default instance exposes Emotion utilities that do not require a Vue component context.

## css

```ts
const className = css({
  display: 'grid',
  gap: 12,
  '&:hover': { opacity: 0.8 },
})
```

The result is a class name string such as `acss-1abcde`, not a React `SerializedStyles` object.

## cx

Merge strings, arrays, conditional objects, and registered Emotion classes:

```ts
const className = cx(base, active && selected, { disabled: props.disabled })
```

## keyframes

```ts
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`
```

## injectGlobal

`injectGlobal` immediately inserts CSS into the current Emotion instance. For theme-reactive global styles with component cleanup, use [`createGlobalStyle`](/en/api/global-styles).
