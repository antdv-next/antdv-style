# 组件研发

<AntdOverrideDemo />

<RuntimeCapabilitiesDemo variant="instance" />

封装 antdv-next 组件时，需要同时考虑默认样式隔离、消费者覆写能力和多实例环境。

## 低优先级默认样式

组件库通常希望默认样式容易被业务侧覆盖。创建独立实例时可设置 `hashPriority: 'low'`，生成 `:where(...)` 包裹的低权重选择器：

```ts
// style-instance.ts
import { createInstance } from 'antdv-style'

export const componentStyle = createInstance({
  key: 'my-lib',
  hashPriority: 'low',
  prefixCls: 'my-lib',
})
```

随后只从这个实例导出组件库内部使用的 `createStyles` 和 `ThemeProvider`，避免与宿主应用共享注入 key。

## 透传 class

公开 `class`、`rootClassName` 或 `classNames` 时，用 `cx` 合并内部与外部 class：

```ts
const rootClass = computed(() => cx(styles.root, attrs.class))
```

不要依赖生成 class name 的具体哈希值；它不是公共契约。

## 组件 Token

优先通过 `ThemeProvider` 的 `theme.components` 配置 antdv-next 组件，再用作用域选择器补充组件 API 无法覆盖的细节。选择器覆写应包含稳定的组件前缀，而不是内部 DOM 的偶然层级。

## Shadow DOM 与微前端

使用 `createInstance({ container })` 或 `StyleProvider` 的 `container` 把 Emotion 与 antdv-next 样式插入指定节点。组件卸载时应由宿主负责移除容器；样式实例可以通过 `getStyleManager` 或 `styleManager` 管理。
