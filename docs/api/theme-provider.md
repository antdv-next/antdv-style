# ThemeProvider

主题上下文提供者组件。自动从 `ConfigProvider` 中检测 antdv-next 的设计 Token。

## Props

| Prop | 类型 | 默认值 | 描述 |
|------|------|---------|-------------|
| `themeMode` | `'light' \| 'dark' \| 'auto'` | `'light'` | 主题模式（受控） |
| `defaultThemeMode` | `ThemeMode` | — | 默认主题模式（非受控） |
| `appearance` | `Appearance` | — | 覆盖外观（受控） |
| `defaultAppearance` | `Appearance` | — | 默认外观（非受控） |
| `theme` | `ThemeConfig \| (appearance) => ThemeConfig` | — | antd 主题覆盖 |
| `customToken` | `object \| (params) => object` | — | 自定义 Token 扩展 |
| `stylish` | `object \| (params) => object` | — | Stylish 预设 |
| `prefixCls` | `string` | `'ant'` | 组件 class 前缀 |
| `iconPrefixCls` | `string` | `'anticon'` | 图标 class 前缀 |

## 事件

| 事件 | 载荷 | 描述 |
|-------|---------|-------------|
| `appearanceChange` | `Appearance` | 外观变化时触发 |
| `themeModeChange` | `ThemeMode` | 主题模式变化时触发 |

## 嵌套

内层 ThemeProvider 会继承外层的 `themeMode` 和 `customToken`。
