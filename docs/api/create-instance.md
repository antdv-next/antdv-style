# createInstance

创建一个拥有独立 Emotion 缓存和 Vue 注入上下文的隔离 antdv-style 实例。

## 签名

```typescript
function createInstance(options?: CreateInstanceOptions): AntdvStyleInstance
```

## 选项

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `key` | `string` | `'css'` | Emotion 缓存键 — 用作 CSS class 前缀 |
| `container` | `HTMLElement` | — | `<style>` 标签插入的目标 DOM 节点 |
| `hashPriority` | `'high' \| 'low'` | — | 生成的 class name 的哈希选择器优先级 |
| `cssVarPrefix` | `string` | — | CSS 变量名前缀 |

## 返回值

实例暴露绑定到其独立缓存和上下文的所有 API 函数：

| 导出项 | 描述 |
|--------|-------------|
| `ThemeProvider` | 作用域主题提供者组件 |
| `StyleProvider` | 作用域样式引擎提供者组件 |
| `createStyles` | 作用域 `createStyles` |
| `createGlobalStyle` | 作用域 `createGlobalStyle` |
| `createStylish` | 作用域 `createStylish` |
| `createStaticStyles` | 作用域 `createStaticStyles` |
| `useTheme` | 作用域 `useTheme` composable |
| `useThemeMode` | 作用域 `useThemeMode` composable |
| `useResponsive` | `useResponsive`（全局单例，不作用域隔离） |
| `useAntdToken` | 作用域 `useAntdToken` composable |
| `useAntdStylish` | 作用域 `useAntdStylish` composable |
| `useAntdTheme` | 作用域 `useAntdTheme` composable |
| `css` | Emotion `css()` 函数 |
| `cx` | Emotion `cx()` 函数 |
| `keyframes` | Emotion `keyframes()` 函数 |
| `injectGlobal` | Emotion `injectGlobal()` 函数 |
| `cssVar` | CSS 变量代理 |
| `responsive` | 静态响应式辅助工具 |
| `tokenToCSSVar` | 将 Token 转换为 CSS 变量引用 |

## 示例

```typescript
// my-design-system/style.ts
import { createInstance } from 'antdv-style'

export const {
  ThemeProvider,
  createStyles,
  useTheme,
  useThemeMode,
} = createInstance({
  key: 'my-ds',
  cssVarPrefix: 'my-ds',
})
```

```vue
<!-- App.vue -->
<script setup>
import { ThemeProvider, createStyles } from './style'

const useStyles = createStyles(({ token, css }) => ({
  root: css({ color: token.colorPrimary }),
}))

const s = useStyles()
</script>

<template>
  <ThemeProvider>
    <div :class="s.styles.root">Hello</div>
  </ThemeProvider>
</template>
```

## 注意事项

- 每个实例拥有独立的 Vue 注入键 — 多个实例可以在同一应用中共存，互不冲突。
- 构建设计系统库时请使用 `createInstance`，以避免消费者自己的 antdv-style 实例产生干扰。
- `useResponsive` 不作用域隔离 — 无论使用哪个实例，它始终使用全局单例。
