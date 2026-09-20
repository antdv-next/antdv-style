<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { App, Button, theme as antdTheme } from 'antdv-next'
import { ThemeProvider, createStyles, useTheme } from 'antdv-style'

const dark = ref(false)
const useStyles = createStyles(({ token }) => ({
  panel: { padding: 16, border: `1px solid ${token.colorBorder}`, marginBottom: 12 },
}))
const Content = defineComponent({
  setup() {
    const s = useStyles()
    const theme = useTheme()
    return () => h('section', { class: s.styles.panel }, [
      h('p', { 'data-testid': 'composition-text' }, 'Native text'),
      h(Button, { type: 'primary' }, { default: () => 'Themed button' }),
      h('output', { style: { display: 'block', marginTop: '12px' } }, theme.value.appearance),
    ])
  },
})
</script>

<template>
  <div class="docs-demo" data-example="composition">
    <div class="docs-demo__stage">
      <label><input v-model="dark" type="checkbox"> Dark</label>
      <ThemeProvider :theme-mode="dark ? 'dark' : 'light'" :theme="{ token: { colorText: '#c41d7f' } }">
        <div data-testid="provider-only"><Content /></div>
        <App data-testid="provider-app"><Content /></App>
        <ThemeProvider :theme="{ algorithm: antdTheme.darkAlgorithm }">
          <App data-testid="provider-nested"><Content /></App>
        </ThemeProvider>
      </ThemeProvider>
    </div>
  </div>
</template>
