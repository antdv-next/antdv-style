# Migrating from Styled Patterns

<RuntimeCapabilitiesDemo variant="styled" />

The Vue package does not provide `styled`. Convert styled components into ordinary Vue components plus prop-aware `createStyles`.

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
    }),
  }),
)

const { styles } = toRefs(useStyles(() => ({ tone: props.tone })))
</script>

<template><span :class="styles.root"><slot /></span></template>
```

This retains native Vue props, slots, attrs, and type inference. Move repeated class-only fragments into `createStylish`.
