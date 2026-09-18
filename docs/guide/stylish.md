# stylish 复合样式

Stylish 是可复用的 class name 集合，适合表达“按钮悬浮态”“可交互卡片”“聚焦环”等比单个 Token 更完整、但还不足以封装成组件的样式片段。

## 创建局部 stylish

```ts
import { createStylish } from 'antdv-style'

const useStylish = createStylish(({ css, token }) => ({
  interactive: css({
    cursor: 'pointer',
    transition: `all ${token.motionDurationMid}`,
    '&:hover': {
      borderColor: token.colorPrimary,
      boxShadow: token.boxShadowTertiary,
    },
  }),
}))

const stylish = useStylish()
```

`useStylish()` 返回 `ComputedRef`，模板中会自动解包；在脚本里使用 `stylish.value.interactive`。

## 扩展全局 stylish

通过 `ThemeProvider` 的 `customStylish` 把业务样式加入主题：

```vue
<ThemeProvider
  :custom-stylish="({ css, token }) => ({
    elevated: css({
      background: token.colorBgElevated,
      boxShadow: token.boxShadowSecondary,
    }),
  })"
>
  <App />
</ThemeProvider>
```

随后可从 `createStyles` 的 `stylish` 或 `useAntdStylish()` 中消费。通过模块扩展声明 `CustomStylish` 可获得完整类型提示。

## 何时不使用

如果样式片段必须依赖复杂 DOM、可访问性行为或业务状态，应封装为 Vue 组件；Stylish 只负责 class，不应承载交互逻辑。
