# useResponsive

基于 `window.matchMedia` 的响应式断点状态。

## 签名

```typescript
function useResponsive(): ResponsiveState
```

返回一个响应式对象，随视口尺寸变化自动更新。

## 返回值

```typescript
interface ResponsiveState {
  // 标准断点
  xs: boolean      // max-width（≤ xsMax — 移动端竖屏）
  sm: boolean      // min-width（≥ 576px）
  md: boolean      // min-width（≥ 768px）
  lg: boolean      // min-width（≥ 992px）
  xl: boolean      // min-width（≥ 1200px）
  xxl: boolean     // min-width（≥ 1600px）

  // 设备别名
  mobile: boolean   // 与 xs 相同的媒体查询
  tablet: boolean   // 与 md 相同的媒体查询
  laptop: boolean   // 与 lg 相同的媒体查询
  desktop: boolean  // 与 xxl 相同的媒体查询
}
```

在 1024px 宽的屏幕上：`xs=false`、`sm=true`、`md=true`、`lg=true`、`xl=false`、`xxl=false`。

## 示例

```vue
<script setup>
import { useResponsive } from 'antdv-style'

const responsive = useResponsive()
</script>

<template>
  <div v-if="responsive.mobile">移动端布局</div>
  <div v-else-if="responsive.lg">桌面端布局</div>
  <div v-else>平板布局</div>
</template>
```

## 注意事项

- 状态是**单例** — 所有组件共享同一组 `matchMedia` 监听器。监听器在首次挂载时创建，在最后一个订阅者卸载时销毁。
- **不**需要 `<ThemeProvider>`。
- SSR 安全：当 `window.matchMedia` 不可用时，断点值默认为 `false`。
