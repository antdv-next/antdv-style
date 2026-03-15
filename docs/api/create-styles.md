# createStyles

创建具有 Token 访问能力的作用域组件样式。

## 签名

```typescript
function createStyles<P = void>(
  factory: ((utils: CreateStylesUtils, props: P) => Record<string, CSSInterpolation | string>) | Record<string, CSSInterpolation | string>,
  options?: { label?: string; hashPriority?: 'high' | 'low' }
): (propsOrGetter?: P | (() => P)) => CreateStylesReturn
```

## 返回值

```typescript
interface CreateStylesReturn {
  styles: Record<string, string>    // Class name 映射表
  cx: (...classNames: ClassNamesArg[]) => string    // 合并 class name
  theme: Theme                       // 完整的主题对象
  prefixCls: string                  // 组件 class 前缀
  iconPrefixCls: string              // 图标 class 前缀
}
```

::: warning
不要从返回值中解构 `styles` — 这会导致丢失 Vue 响应性。请使用 `s.styles.xxx` 代替。
:::

## 示例

详细用法请参阅[指南：createStyles](/guide/create-styles)。
