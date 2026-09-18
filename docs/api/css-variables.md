# CSS 变量工具

## cssVar

默认实例导出的 `cssVar` 是一个惰性代理，把 Token 属性映射为 antdv-next CSS 变量引用：

```ts
cssVar.colorPrimary // var(--ant-color-primary)
cssVar.screenXSMax  // var(--ant-screen-xs-max)
```

在 `createStyles` 和 `createStaticStyles` 的工具参数中也可以访问它。

代理只返回 `var(...)` 引用，不会注入变量定义。原生元素需要位于匹配的变量作用域内，
例如 ThemeProvider 下的 antdv-next `App`，或由业务容器自行定义这些变量。

`createStyles` 中的 `cssVar` 会跟随当前 ThemeProvider 的有效变量前缀；
顶层导出的 `cssVar` 和静态样式不读取组件上下文。多个主题共享组件前缀、
但使用不同变量前缀时，需要开启组件哈希，详见
[ThemeProvider 组件样式隔离](./theme-provider#组件样式隔离)。

## createCSSVarProxy

自定义前缀时会自动回退到 `--ant-*`：

```ts
const vars = createCSSVarProxy({ prefix: 'acme' })

vars.colorPrimary
// var(--acme-color-primary, var(--ant-color-primary))
```

## tokenToCSSVar

把普通 Token 对象转换为变量声明文本：

```ts
tokenToCSSVar(
  { colorBrand: '#1677ff', spacingLG: 24 },
  { prefix: 'app' },
)
```

结果：

```css
--app-color-brand: #1677ff;
--app-spacing-lg: 24;
```

以下属性会被跳过：以下划线开头、名称已包含连字符、值为对象或函数的属性。
