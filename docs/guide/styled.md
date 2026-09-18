# styled 生态说明

<RuntimeCapabilitiesDemo variant="styled" />

upstream antd-style 为 React styled 生态提供主题兼容说明，但本项目是 Vue 3 实现，当前不内置 `styled` 与 `setupStyled`。

## 推荐替代方案

| React antd-style | Vue antdv-style |
|---|---|
| `styled.div` | Vue SFC + `createStyles` |
| styled props | `createStyles<Props>` + props getter |
| `setupStyled` | `createInstance` 隔离实例 |
| styled theme context | `ThemeProvider` + `useTheme` |

```vue
<script setup lang="ts">
import { toRefs } from 'vue'
import { createStyles } from 'antdv-style'

const props = defineProps<{ selected?: boolean }>()

const useStyles = createStyles<{ selected: boolean }>(
  ({ css, token }, value) => ({
    root: css({
      color: value.selected ? token.colorPrimary : token.colorText,
    }),
  }),
)

const { styles } = toRefs(useStyles(() => ({ selected: Boolean(props.selected) })))
</script>

<template><div :class="styles.root"><slot /></div></template>
```

如果项目已经使用第三方 Vue styled 库，可以通过 `useTheme()` 把 Token 显式传给它，但 antdv-style 不保证第三方库的 SSR、缓存或类型契约。
