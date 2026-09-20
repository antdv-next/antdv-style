<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { Select } from 'antdv-next'
import { createStyles, ThemeProvider } from 'antdv-style'

const useStyles = createStyles(({ css, token }) => ({
  root: css({ width: 240, maxWidth: '100%' }),
  popup: css({
    padding: 6,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 8,
    background: token.colorBgElevated,
    boxShadow: token.boxShadowSecondary,
  }),
}))
const Picker = defineComponent({
  setup() {
    const s = useStyles()
    const value = ref('system')
    return () => h('div', { 'data-testid': 'mac-select' }, [
      h(Select, {
        value: value.value,
        'onUpdate:value': next => { value.value = String(next) },
        class: s.styles.root,
        classes: { popup: { root: s.styles.popup } },
        'aria-label': 'Appearance preset',
        options: [
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ],
      }),
      h('output', { 'data-testid': 'mac-value', style: 'display:block;margin-top:12px' }, value.value),
    ])
  },
})
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <ThemeProvider><Picker /></ThemeProvider>
    </div>
  </div>
</template>
