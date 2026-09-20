# 黏土风 UI

<ClayDemo />

黏土风格依赖柔和背景、较大圆角和内外双重阴影。所有颜色都应来自 Token，确保亮暗主题可读。

```ts
const useClayStyles = createStyles(({ css, token }) => ({
  panel: css({
    padding: 24,
    borderRadius: 24,
    color: token.colorText,
    background: token.colorBgContainer,
    boxShadow: `12px 12px 24px ${token.colorFillSecondary}`,
  }),
}))
```

## 可用性注意

- 不要只靠阴影表达按钮状态，同时保留边框或颜色变化。
- 暗色模式降低高光强度，避免纯白内阴影。
- 大面积模糊阴影会增加绘制成本，列表中应减少层数。
- 聚焦态仍需清晰的 focus ring。
