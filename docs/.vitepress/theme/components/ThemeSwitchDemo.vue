<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { ThemeProvider, createStyles, type ThemeMode } from 'antdv-style'

const mode = ref<ThemeMode>('light')
const modes: ThemeMode[] = ['light', 'dark', 'auto']
const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  preview: css({
    padding: 24,
    borderRadius: token.borderRadiusLG,
    color: token.colorText,
    background: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: token.boxShadowTertiary,
  }),
  label: css({ margin: 0, color: isDarkMode ? token.colorPrimaryHover : token.colorPrimary }),
}))

const ThemePreview = defineComponent({
  props: { mode: { type: String, required: true } },
  setup(props) {
    const s = useStyles()
    return () => h('div', { class: s.styles.preview }, [
      h('h3', { class: s.styles.label }, `${props.mode} mode`),
      h('p', { style: 'margin-bottom: 0' }, 'Theme tokens and generated class names update together.'),
    ])
  },
})
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <div class="demo-row" style="margin-bottom: 16px">
        <button
          v-for="item in modes"
          :key="item"
          class="demo-button"
          :class="{ 'is-active': mode === item }"
          type="button"
          @click="mode = item"
        >
          {{ item }}
        </button>
      </div>
      <ThemeProvider :theme-mode="mode">
        <ThemePreview :mode="mode" />
      </ThemeProvider>
    </div>
    <div class="docs-demo__caption">Controlled light, dark, and system-driven theme modes.</div>
  </div>
</template>
