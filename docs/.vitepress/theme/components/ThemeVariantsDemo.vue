<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { Button, theme as antdTheme } from 'antdv-next'
import { ThemeProvider, createStyles, useThemeMode, useResponsive, type ThemeMode } from 'antdv-style'

const props = defineProps<{ variant: 'appearance' | 'controlled' | 'responsive' }>()
const appearance = ref('light')
const mode = ref<ThemeMode>('light')
const breakpoint = ref(900)
const accept = ref(true)
const requested = ref('')
const useStyles = createStyles(({ token }) => ({
  panel: { padding: 20, background: token.colorBgContainer, color: token.colorText, border: `1px solid ${token.colorBorder}`, borderRadius: 4 },
}))
const Preview = defineComponent({
  setup() {
    const s = useStyles()
    const state = useThemeMode()
    const screens = useResponsive()
    return () => h('div', { class: s.styles.panel, 'data-testid': `theme-${props.variant}` }, [
      h('output', { 'data-testid': 'appearance-output' }, state.appearance.value),
      props.variant === 'controlled'
        ? h('div', { class: 'demo-row' }, (['light', 'dark', 'auto'] as const).map(value =>
          h('button', { type: 'button', class: 'demo-button', onClick: () => state.setThemeMode(value) }, value)))
        : props.variant === 'responsive'
          ? h('output', { 'data-testid': 'custom-md', style: { display: 'block' } }, `md: ${screens.md}`)
          : h(Button, { type: 'primary', style: { marginLeft: '16px' } }, appearance.value),
    ])
  },
})
const resolveTheme = (value: string) => ({
  algorithm: value === 'light' ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm,
  token: { colorPrimary: value === 'grey' ? '#888888' : value === 'dark' ? '#13c2c2' : '#1677ff' },
})
const changeMode = (next: ThemeMode) => {
  requested.value = next
  if (accept.value) mode.value = next
}
</script>

<template>
  <div class="docs-demo" :data-example="variant">
    <div class="docs-demo__stage">
      <div v-if="variant === 'appearance'" class="demo-row" role="radiogroup" aria-label="Appearance">
        <label v-for="item in ['light', 'dark', 'grey']" :key="item">
          <input v-model="appearance" type="radio" :value="item"> {{ item }}
        </label>
      </div>
      <label v-if="variant === 'controlled'"><input v-model="accept" type="checkbox"> Accept changes</label>
      <label v-if="variant === 'responsive'">md <input v-model.number="breakpoint" type="range" min="600" max="1600" step="100"></label>
      <ThemeProvider v-if="variant === 'appearance'" :appearance="appearance" :theme="resolveTheme">
        <Preview />
      </ThemeProvider>
      <ThemeProvider v-else-if="variant === 'controlled'" :theme-mode="mode" @theme-mode-change="changeMode">
        <Preview />
      </ThemeProvider>
      <ThemeProvider v-else :theme="{ token: { screenMD: breakpoint, screenMDMin: breakpoint } }">
        <Preview />
      </ThemeProvider>
      <output v-if="requested" data-testid="requested-mode">{{ requested }}</output>
    </div>
  </div>
</template>
