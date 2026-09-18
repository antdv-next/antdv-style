# Less 应用手动迁移

<MigrationComparisonDemo />

## 1. 保持 DOM 不变

先把 `.less` 中的 class 一一映射为 `createStyles` 的键，组件模板只替换 class 来源。第一步不要同时重构 DOM。

```ts
// style.ts
export const useStyles = createStyles(({ css, token }) => ({
  root: css({ padding: token.paddingLG }),
  title: css({ color: token.colorTextHeading }),
}))
```

```vue
<script setup lang="ts">
import { toRefs } from 'vue'
import { useStyles } from './style'
const { styles } = toRefs(useStyles())
</script>

<template>
  <section :class="styles.root">
    <h2 :class="styles.title">Title</h2>
  </section>
</template>
```

## 2. 替换变量

把颜色、间距、字体、阴影和断点优先替换为 Token。业务专属变量放进 `customToken`，不要继续维护平行的全局 Less 变量表。

## 3. 迁移嵌套规则

Emotion 支持 `&`、伪类和后代选择器。父子联动时先为子节点生成稳定 class，再在父规则中引用，详见[父子联动样式](/best-practice/nest-element-style)。

## 4. 处理全局样式

页面 reset 和根选择器迁移到 `createGlobalStyle`。只为覆写第三方组件而存在的 `:global` 应先检查是否有组件 Token 或 `classNames` API。

## 5. 清理构建配置

当目录内不再引用 Less 后，再移除对应 loader、类型声明与变量注入配置。分阶段迁移时可以让两套方案并存。
