# antdv-style

[antdv-next](https://github.com/antdv-next/antdv-next) 的 CSS-in-JS 解决方案，基于 [Emotion](https://emotion.sh/)。

[English](./README.md)

- **Token 系统**：自动集成 antdv-next ConfigProvider 提供的 500+ 设计 Token
- **暗色模式**：支持 `light` / `dark` / `auto`，可跟随系统偏好
- **主题定制**：通过 ThemeProvider 扩展自定义 Token 和 Stylish 预设
- **CSS 变量**：`cssVar.colorPrimary` → `var(--ant-color-primary)`
- **响应式**：Token 驱动的断点工具，支持函数调用和设备别名
- **多实例**：`createInstance()` 为微前端场景提供隔离
- **SSR 安全**：导入时不访问 DOM，支持 Emotion 样式提取
- **TypeScript**：通过模块增强为自定义 Token 提供完整 IntelliSense

## 快速开始

### 安装

```bash
pnpm add antdv-style antdv-next
```

### 创建样式

```vue
<script setup>
import { ConfigProvider } from 'antdv-next'
import { ThemeProvider, createStyles } from 'antdv-style'

const useStyles = createStyles(({ token, css }) => ({
  // CSS 对象语法
  container: {
    backgroundColor: token.colorBgLayout,
    borderRadius: token.borderRadiusLG,
    maxWidth: 400,
    width: '100%',
    padding: `${token.paddingLG}px`,
  },
  // CSS 模板字符串语法
  card: css`
    box-shadow: ${token.boxShadow};
    padding: ${token.padding}px;
    border-radius: ${token.borderRadius}px;
    background: ${token.colorBgContainer};
    cursor: pointer;

    &:hover {
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
}))

const s = useStyles()
</script>

<template>
  <ConfigProvider>
    <ThemeProvider>
      <div :class="s.styles.container">
        <div :class="s.styles.card">createStyles 示例</div>
        <div>当前主题：{{ s.theme.appearance }}</div>
      </div>
    </ThemeProvider>
  </ConfigProvider>
</template>
```

## 许可证

[MIT](./LICENSE)
