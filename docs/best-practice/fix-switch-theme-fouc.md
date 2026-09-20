# 解决主题切换 FOUC

FOUC 指服务端或静态 HTML 先以亮色显示，客户端启动后再切换为暗色，导致首屏闪烁。

## 根因

浏览器绘制第一帧时，Vue 尚未挂载，`ThemeProvider` 的 `auto` 模式也还没有读取 `prefers-color-scheme`。如果 HTML 和 CSS 变量默认是亮色，就会出现外观跳变。

## 推荐方案

1. 服务端从 Cookie 读取用户偏好，并给 `ThemeProvider` 传入确定的初始 `appearance`。
2. 在应用脚本前执行一小段内联脚本，把 `data-theme` 写到 `<html>`。
3. 用基础 CSS 为 `html[data-theme='dark']` 设置首屏背景和 `color-scheme`。
4. 客户端挂载后再交给 `themeMode="auto"` 监听系统变化。

```html
<script>
  const saved = localStorage.getItem('theme')
  const dark = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
</script>
```

::: warning CSP
严格 CSP 环境需要为内联脚本配置 nonce，或把脚本放入允许的静态文件。不要为了消除闪烁放宽整个站点的脚本策略。
:::

SSR 还应注入 [`extractStaticStyle`](/api/extract-static-style) 返回的标签，避免结构样式本身晚到。
