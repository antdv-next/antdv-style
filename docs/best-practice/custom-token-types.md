# 扩展自定义 Token 类型

通过 TypeScript 模块扩展，可以让 `customToken`、`useTheme` 和 `createStyles` 共享业务 Token 类型。

## 声明类型

```ts
// src/types/antdv-style.d.ts
import 'antdv-style'

declare module 'antdv-style' {
  interface CustomToken {
    brandGradient: string
    sidebarWidth: number
  }

  interface CustomStylish {
    focusRing: string
  }
}
```

确保该声明文件包含在 `tsconfig.json` 的 `include` 中。

## 提供值

```vue
<ThemeProvider
  :custom-token="({ token, isDarkMode }) => ({
    brandGradient: isDarkMode
      ? `linear-gradient(90deg, ${token.blue7}, ${token.purple6})`
      : `linear-gradient(90deg, ${token.blue5}, ${token.purple5})`,
    sidebarWidth: 264,
  })"
  :custom-stylish="({ css, token }) => ({
    focusRing: css({ outline: `2px solid ${token.colorPrimaryBorder}` }),
  })"
>
  <App />
</ThemeProvider>
```

`CustomToken` 会合并进 `Theme`，`CustomStylish` 会合并进 `theme.stylish`。嵌套 Provider 默认继承父级自定义 Token，再用当前层覆盖同名字段。
