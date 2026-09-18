# CSS-in-JS 与 Less 的编译差异

## 执行时机

Less 在构建时把源文件编译为静态 CSS；`createStyles` 在运行时根据主题与 props 生成 class。`createStaticStyles` 则更接近构建后静态 CSS：模块首次执行时生成一次样式。

## 变量

Less 变量在编译期求值。Token 是运行时主题数据，CSS 变量则由浏览器求值：

```ts
// 运行时 Token
css({ color: token.colorPrimary })

// 浏览器运行时 CSS 变量
css({ color: cssVar.colorPrimary })
```

## 嵌套与选择器

Less 允许任意嵌套和 mixin；Emotion 接受对象嵌套与 `&`，但不会执行 Less 函数。复杂 mixin 应改为 TypeScript 函数或复用的 Stylish。

## 单位

Emotion 对多数数值属性自动补 `px`，无单位属性保持数字。迁移时注意 `lineHeight`、`fontWeight`、`opacity`、`zIndex` 等属性。

## 导入与作用域

Less `@import` 会合并样式文件；TypeScript 模块应显式导出 `useStyles`、静态 class 或样式工厂。样式作用域来自生成 class，而不是文件名。

## SSR

静态 CSS 可直接由服务器链接；运行时 CSS-in-JS 需要在服务端渲染后抽取并注入 style 标签。详见 [SSR 集成](/guide/ssr)。
