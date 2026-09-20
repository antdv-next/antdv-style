# 从 styled 模式迁移

<RuntimeCapabilitiesDemo variant="styled" />

Vue 版不提供 `styled`。迁移时把“样式组件”拆回普通 Vue 组件和 `createStyles`，保留 props 驱动样式的能力。

```vue
<script setup lang="ts">
import { toRefs } from 'vue'
import { createStyles } from 'antdv-style'

const props = withDefaults(defineProps<{ tone?: 'brand' | 'neutral' }>(), {
  tone: 'neutral',
})

const useStyles = createStyles<{ tone: 'brand' | 'neutral' }>(
  ({ css, token }, value) => ({
    root: css({
      color: value.tone === 'brand' ? token.colorPrimary : token.colorText,
      fontWeight: 650,
    }),
  }),
)

const { styles } = toRefs(useStyles(() => ({ tone: props.tone })))
</script>

<template><span :class="styles.root"><slot /></span></template>
```

这种方式保留 Vue 的 props、slots、attrs 和类型推导，不引入额外组件工厂。重复的纯样式片段可进一步抽为 `createStylish`。
