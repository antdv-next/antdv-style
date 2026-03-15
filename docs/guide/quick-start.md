# 快速上手

## 安装

```bash
pnpm add antdv-style antdv-next
```

## 基础配置

用 antdv-next 的 `ConfigProvider` 和 antdv-style 的 `ThemeProvider` 包裹你的应用：

```vue
<!-- App.vue -->
<script setup>
import { ConfigProvider } from 'antdv-next'
import { ThemeProvider } from 'antdv-style'
</script>

<template>
  <ConfigProvider>
    <ThemeProvider>
      <router-view />
    </ThemeProvider>
  </ConfigProvider>
</template>
```

`ThemeProvider` 会自动从 `ConfigProvider` 中检测设计 Token，无需手动传递 Token。

## 第一个组件

```vue
<script setup>
import { createStyles } from 'antdv-style'

const useStyles = createStyles(({ token, css }) => ({
  container: {
    backgroundColor: token.colorBgLayout,
    padding: `${token.paddingLG}px`,
    borderRadius: `${token.borderRadiusLG}px`,
  },
  card: css`
    background: ${token.colorBgContainer};
    padding: ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    box-shadow: ${token.boxShadowTertiary};

    &:hover {
      box-shadow: ${token.boxShadow};
    }
  `,
}))

const s = useStyles()
</script>

<template>
  <div :class="s.styles.container">
    <div :class="s.styles.card">
      Hello antdv-style!
    </div>
  </div>
</template>
```

## 自定义 Token

用你自己的 Token 扩展设计系统：

```vue
<ThemeProvider :custom-token="{ brandColor: '#7c3aed' }">
  <!-- 所有 createStyles 中均可使用 token.brandColor -->
</ThemeProvider>
```

添加 TypeScript 支持：

```typescript
declare module 'antdv-style' {
  interface CustomToken {
    brandColor: string
  }
}
```

## 暗色模式

```vue
<ThemeProvider theme-mode="auto">
  <!-- 跟随系统偏好 -->
</ThemeProvider>
```

编程控制切换：

```typescript
const { setThemeMode } = useThemeMode()
setThemeMode('dark')
```
