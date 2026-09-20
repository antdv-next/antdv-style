<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { Button } from 'antdv-next'
import { createStyles, ThemeProvider, useThemeMode } from 'antdv-style'

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  panel: css({
    padding: 24,
    borderRadius: 8,
    color: token.colorText,
    background: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: `inset 4px 4px 8px ${token.colorFillQuaternary}, 6px 6px 14px ${token.colorFillSecondary}`,
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
    '& button:focus-visible': { outline: `2px solid ${token.colorPrimary}`, outlineOffset: 4 },
  }),
  value: css({ color: isDarkMode ? token.colorPrimaryHover : token.colorPrimary, fontSize: 24 }),
}))
const Preview = defineComponent({
  setup() {
    const s = useStyles()
    const { isDarkMode, setThemeMode } = useThemeMode()
    const count = ref(0)
    return () => h('div', { class: s.styles.panel, 'data-testid': 'clay-panel' }, [
      h('output', { class: s.styles.value, 'data-testid': 'clay-count' }, count.value),
      h(Button, { onClick: () => count.value++, 'data-testid': 'clay-add' }, () => 'Add'),
      h(Button, {
        onClick: () => setThemeMode(isDarkMode.value ? 'light' : 'dark'),
        'data-testid': 'clay-theme',
      }, () => isDarkMode.value ? 'Light' : 'Dark'),
    ])
  },
})
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <ThemeProvider default-theme-mode="light"><Preview /></ThemeProvider>
    </div>
  </div>
</template>
