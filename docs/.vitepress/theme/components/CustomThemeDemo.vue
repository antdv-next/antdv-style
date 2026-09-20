<script setup lang="ts">
import { defineComponent, h, onUnmounted, ref } from 'vue'
import { createInstance } from 'antdv-style'

const accent = ref('#00796b')
const spacing = ref(16)
const style = createInstance<{ accent: string; spacing: number }>({
  key: 'docs-custom-theme',
  customToken: { accent: accent.value, spacing: spacing.value },
})
const useStyles = style.createStyles(({ token }) => ({
  preview: {
    color: token.colorText,
    background: token.colorBgContainer,
    border: `2px solid ${token.accent}`,
    padding: token.spacing,
  },
}))
const Preview = defineComponent({
  setup() {
    const s = useStyles()
    return () => h('div', { class: s.styles.preview, 'data-testid': 'custom-theme-preview' }, 'Custom tokens')
  },
})
onUnmounted(() => style.dispose())
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <div class="demo-row" style="margin-bottom: 16px">
        <label>Accent <input v-model="accent" type="color" data-testid="custom-accent"></label>
        <label>Spacing <input v-model.number="spacing" type="range" min="8" max="32" data-testid="custom-spacing"></label>
      </div>
      <style.ThemeProvider :custom-token="{ accent, spacing }" :theme="{ token: { colorPrimary: accent } }">
        <Preview />
      </style.ThemeProvider>
    </div>
  </div>
</template>
