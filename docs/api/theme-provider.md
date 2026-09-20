# ThemeProvider

<ThemeCompositionDemo />

ThemeProvider 自身不渲染 DOM。原生文本不会仅因为主题上下文而获得样式；
配合 antdv-next 的 `App` 可以把文字颜色等基础样式限制在其 DOM 范围内，
也可用 `createStyles` 显式设置元素样式。

<ThemeVariantsDemo variant="controlled" />

<RuntimeCapabilitiesDemo variant="nested" />

<StaticMessageDemo />

<RuntimeCapabilitiesDemo variant="global" />

<CustomThemeDemo />

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
| `prefixCls` | `string` | 继承 | 组件 class 前缀；依次继承父 ThemeProvider、实例默认值和 ConfigProvider |
| `iconPrefixCls` | `string` | 继承 | 图标 class 前缀 |
| `customStylish` | `(params) => object` | — | `stylish` 函数形式的兼容入口 |
| `getStaticInstance` | `(instances) => void` | — | 获取 message、notification、modal 的上下文静态实例 |
| `staticInstanceConfig` | `object` | — | message 与 notification 的 holder 配置 |

`customToken` 函数接收 `{ token, appearance, isDarkMode }`。`stylish`/`customStylish` 函数额外接收合并后的 `token`、内置 `stylish` 与 `css`。

## 事件

| 事件 | 载荷 | 描述 |
|-------|---------|-------------|
| `appearanceChange` | `Appearance` | 外观变化时触发 |
| `themeModeChange` | `ThemeMode` | 主题模式变化时触发 |

也可以通过 `onAppearanceChange` 与 `onThemeModeChange` props 使用同名回调。

## 嵌套

### 组件样式隔离

`theme.hashed` 按「当前 `theme` 配置、祖先 ConfigProvider 的有效配置、`true`」取值。
没有祖先配置时，ThemeProvider 默认开启组件哈希，避免同一 `prefixCls` 下不同
`theme.cssVar.prefix` 的组件复用错误的样式。这与 antdv-next 原生 ConfigProvider
默认关闭哈希不同；不会改动原生 ConfigProvider 的全局默认值。

```vue
<ThemeProvider :theme="{ hashed: true, cssVar: { prefix: 'brand' } }">
  <App />
</ThemeProvider>
```

祖先的有效 `hashed: false` 会被继承，即使它来自原生 ConfigProvider 的默认值。
需要独立变量前缀或运行时切换前缀时，显式设置 `theme.hashed: true`。
显式 `false` 仍受支持，但此时同一组件前缀必须保持一致的变量前缀；
不同主题可改用不同且稳定的 `prefixCls`。仅增加独立缓存或 `cssVar.key`
不能替代选择器隔离。该配置不解决不同 ShadowRoot 的样式注入限制，
参见 [StyleProvider](./style-provider)。

未显式设置时，内层 ThemeProvider 会响应式继承外层的 `themeMode`、`appearance`、自定义 Token、Stylish、`prefixCls` 与 `iconPrefixCls`。局部值只覆盖对应字段。

当 ThemeProvider 位于 StyleProvider 内部时，它会继续使用 StyleProvider 提供的 Emotion 引擎：

```vue
<StyleProvider cache-key="micro-app" :container="shadowRoot" nonce="nonce-value">
  <ThemeProvider>
    <App />
  </ThemeProvider>
</StyleProvider>
```

## 实例级 Token 类型

组件库或微前端可以用泛型创建隔离实例，无需修改全局模块声明：

```ts
interface LibraryToken {
  brandColor: string
  headerHeight: number
}

export const libraryStyle = createInstance<LibraryToken>({
  key: 'library',
  customToken: { brandColor: '#1677ff', headerHeight: 56 },
})

libraryStyle.createStyles(({ token }) => ({
  root: { color: token.brandColor, height: token.headerHeight },
}))
```

## 静态实例

```vue
<ThemeProvider :get-static-instance="instances => staticApi = instances">
  <App />
</ThemeProvider>
```

返回的 API 处于当前 ConfigProvider/ThemeProvider 上下文中，适合替代脱离上下文的全局 message、notification 与 modal 调用。
