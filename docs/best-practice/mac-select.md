# macOS 风格选择器

<MacSelectDemo />

此 Vue 示例用 antdv-next Select 处理键盘、焦点和浮层，antdv-style 通过 `classes.popup.root` 配置弹层样式。

自定义选择器通常包含浮层定位、键盘导航、焦点管理和滚动反馈。antdv-style 只负责视觉层，交互建议使用成熟的 headless/floating 库。

## 样式组织

```ts
const useStyles = createStyles(({ css, token }) => ({
  popup: css({
    minWidth: 220,
    padding: 6,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgElevated,
    boxShadow: token.boxShadowSecondary,
  }),
  option: css({
    minHeight: 32,
    paddingInline: 10,
    borderRadius: token.borderRadiusSM,
    '&[data-active=true]': {
      color: token.colorTextLightSolid,
      background: token.colorPrimary,
    },
  }),
}))
```

## 交互清单

- 使用 WAI-ARIA combobox/listbox 语义。
- 支持方向键、Enter、Escape 和输入法组合事件。
- 浮层挂载到自定义容器时，同步设置 `StyleProvider.container`。
- 动画遵循 `prefers-reduced-motion`。
