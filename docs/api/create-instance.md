# createInstance

<RuntimeCapabilitiesDemo variant="instance" />

<StyleEngineDemo />

创建一个拥有独立 Emotion 缓存和 Vue 注入上下文的隔离 antdv-style 实例。

## 签名

```typescript
function createInstance<TToken extends object = CustomToken>(
  options?: CreateInstanceOptions<TToken>,
): CreateInstanceResult<TToken>
```

## 选项

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
| `key` | `string` | `'zcss'` | Emotion 缓存键，用作 CSS class 前缀 |
| `container` | `Node` | — | `<style>` 标签插入的目标 DOM 节点 |
| `hashPriority` | `'high' \| 'low'` | `'high'` | 生成 class 的选择器优先级；`low` 使用 `:where()` |
| `cssVarPrefix` | `string` | `prefixCls` 或 `'ant'` | CSS 变量名前缀 |
| `prefixCls` | `string` | `'ant'` | antdv-next 组件 class 前缀 |
| `iconPrefixCls` | `string` | `'anticon'` | antdv-next 图标 class 前缀 |
| `speedy` | `boolean` | `false` | 是否使用 Emotion CSSOM speedy 模式 |
| `nonce` | `string` | — | 写入 Emotion `<style>` 标签的 CSP nonce |
| `insertionPoint` | `HTMLElement` | — | Emotion 样式插入点 |
| `stylisPlugins` | `StylisPlugin[]` | — | 传给 Emotion 的 Stylis 插件 |
| `customToken` | `TToken` | — | 实例级自定义 Token 默认值，并传播类型到样式和主题 API |

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
| `useResponsive` | 读取最近的 ConfigProvider 断点；相同配置共享监听器，不同配置隔离 |
| `useAntdToken` | 作用域 `useAntdToken` composable |
| `useAntdStylish` | 作用域 `useAntdStylish` composable |
| `useAntdTheme` | 作用域 `useAntdTheme` composable |
| `css` | Emotion `css()` 函数 |
| `cx` | Emotion `cx()` 函数 |
| `keyframes` | Emotion `keyframes()` 函数 |
| `injectGlobal` | Emotion `injectGlobal()` 函数 |
| `cssVar` | CSS 变量代理 |
| `responsive` | 静态响应式辅助工具 |
| `tokenToCSSVar` | 将 Token 转换为 CSS 变量声明文本 |
| `styleManager` | 原始 Emotion 实例，可传给 `extractStaticStyle` 或 `createCacheManager` |
| `staticStylesCache` | 当前实例的静态样式缓存 |
| `dispose` | 注销实例并清空 Emotion 样式；可重复调用 |

## 示例

```typescript
// my-design-system/style.ts
import { createInstance } from 'antdv-style'

interface DesignToken {
  brandColor: string
}

export const {
  ThemeProvider,
  createStyles,
  useTheme,
  useThemeMode,
  dispose,
} = createInstance<DesignToken>({
  key: 'my-ds',
  cssVarPrefix: 'my-ds',
  customToken: { brandColor: '#1677ff' },
})
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ThemeProvider } from './style'
import StyledCard from './StyledCard.vue'
</script>

<template>
  <ThemeProvider><StyledCard /></ThemeProvider>
</template>
```

```vue
<!-- StyledCard.vue -->
<script setup lang="ts">
import { createStyles } from './style'

const useStyles = createStyles(({ token, css }) => ({
  root: css({ color: token.brandColor }),
}))

const s = useStyles()
</script>

<template>
  <div :class="s.styles.root">Hello</div>
</template>
```

## 注意事项

- 每个实例拥有独立的 Vue 注入键 — 多个实例可以在同一应用中共存，互不冲突。
- 构建设计系统库时请使用 `createInstance`，以避免消费者自己的 antdv-style 实例产生干扰。
- `useResponsive` 不绑定实例的专属注入键，而是读取调用位置最近的 ConfigProvider。相同断点配置共享监听器，不同配置隔离，并响应 Token 变化。
- SSR 中应为每个请求创建实例，并在抽取样式后通过 `dispose()` 释放注册表和 Emotion 样式。
- 使用 CSP 时传入 `nonce`；服务端抽取出的 Emotion `<style>` 标签会保留该值。
