# createStaticStyles

在模块加载时生成一次静态 class，适合只依赖常量、CSS 变量与固定媒体查询的样式。

<StaticStylesDemo />

<ResponsiveStylesDemo static />

## 签名

```ts
function createStaticStyles<T extends StaticStylesInput>(
  factoryOrStyles: StaticStyleFactory<T> | T,
): StaticStylesResult<T>
```

对象输入返回一个带 class 属性的兼容调用对象：

```ts
const styles = createStaticStyles(({ cssVar, responsive }) => ({
  container: {
    display: 'grid',
    gap: 16,
    color: cssVar.colorText,
    [responsive.mobile]: { gap: 8 },
  },
  hidden: { display: 'none' },
}))

styles.container // acss-...

// 兼容 composable 风格
const { styles: classMap, cx } = styles()
```

推荐直接使用 `styles.container`。调用式返回值用于兼容已有的 `const { styles } = useStyles()` 写法。

## 工厂工具

| 属性 | 类型 | 描述 |
|---|---|---|
| `css` | `CssUtil` | 生成单条 class |
| `cx` | `ClassNamesUtil` | 合并 class |
| `cssVar` | `Record<string, string>` | CSS 变量引用代理 |
| `responsive` | `ResponsiveHelpers` | 固定媒体查询映射 |

此 API 不提供 `token`、`appearance` 或 props，因为它不会进入 Vue setup，也不会响应 JavaScript 主题状态。

`cssVar` 只生成引用，不定义变量。使用变量的原生元素必须放在对应的变量作用域内；
上面的示例用 `<ThemeProvider><App>...</App></ThemeProvider>` 提供主题与
antdv-next 的 DOM 变量作用域。也可以在自己的容器上显式定义变量。

## 字符串输入

工厂直接返回 `css(...)` 的 class 字符串时，`createStaticStyles` 也直接返回字符串。

## 自定义静态实例

`createStaticStylesFactory` 可以指定变量前缀、哈希优先级和 Emotion cache：

```ts
const staticStyle = createStaticStylesFactory({
  prefix: 'acme',
  hashPriority: 'low',
})

const styles = staticStyle.createStaticStyles(({ cssVar }) => ({
  root: { color: cssVar.colorPrimary },
}))
```

默认静态 cache 也通过 `staticStylesCache` 导出，便于 SSR 或定制抽取。
