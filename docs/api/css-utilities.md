# css / cx / keyframes / injectGlobal

默认实例直接导出一组不依赖 Vue 组件上下文的 Emotion 工具。

## css

把样式对象或模板字符串转换为 class name：

```ts
import { css } from 'antdv-style'

const className = css({
  display: 'grid',
  gap: 12,
  '&:hover': { opacity: 0.8 },
})
```

返回值是字符串，例如 `acss-1abcde`，不是 React `SerializedStyles` 对象。

## cx

合并字符串、数组和条件对象，并合并已注册的 Emotion 样式：

```ts
const className = cx(base, active && selected, { disabled: props.disabled })
```

## keyframes

```ts
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const animated = css({ animation: `${fadeIn} 200ms ease-out` })
```

## injectGlobal

立即向当前 Emotion 实例注入全局 CSS：

```ts
injectGlobal`
  html { color-scheme: light dark; }
`
```

需要响应主题并在组件卸载时清理的全局样式，应使用 [`createGlobalStyle`](/api/global-styles)。
