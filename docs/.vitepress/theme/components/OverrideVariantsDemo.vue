<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { Button, Input } from 'antdv-next'
import { ThemeProvider, createStyles } from 'antdv-style'

const value = ref('')
const strong = ref(false)
const useStyles = createStyles(({ token, prefixCls }, props: { strong: boolean }) => ({
  root: { padding: 16, background: token.colorBgLayout },
  wrapper: { border: `2px solid ${token.colorPrimary}`, background: 'transparent' },
  input: { background: 'transparent' },
  suffix: { color: token.colorPrimary },
  override: {
    [`&.${prefixCls}-btn`]: { borderColor: token.colorPrimary },
    ...(props.strong ? { '&&': { borderWidth: 3, fontWeight: 700 } } : {}),
  },
}))
const Preview = defineComponent({
  setup() {
    const s = useStyles(() => ({ strong: strong.value }))
    return () => h('div', { class: s.styles.root }, [
      h(Button, { class: s.styles.override, 'data-testid': 'specificity-button' }, { default: () => 'Scoped override' }),
      h(Input, {
        value: value.value, 'onUpdate:value': (next: string) => { value.value = next },
        placeholder: 'Semantic input classes', suffix: '$', 'data-testid': 'semantic-input',
        classes: { root: s.styles.wrapper, input: s.styles.input, suffix: s.styles.suffix },
        style: { marginTop: '16px' },
      }),
    ])
  },
})
</script>

<template>
  <div class="docs-demo" data-example="overrides">
    <div class="docs-demo__stage">
      <label><input v-model="strong" type="checkbox"> Higher specificity</label>
      <ThemeProvider><Preview /></ThemeProvider>
    </div>
  </div>
</template>
