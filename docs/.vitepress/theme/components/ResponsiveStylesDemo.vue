<script setup lang="ts">
import { defineComponent, h } from 'vue'
import { ThemeProvider, createStyles, createStaticStyles, useResponsive } from 'antdv-style'

const props = defineProps<{ static?: boolean }>()
const staticStyles = createStaticStyles(({ responsive }) => ({
  panel: {
    padding: 20, background: '#e6f4ff', color: '#0958d9',
    [responsive.tablet]: { background: '#f6ffed', color: '#237804' },
    [responsive.desktop]: { background: '#fff0f6', color: '#c41d7f' },
    [responsive.mobile]: { background: '#fffbe6', color: '#874d00' },
  },
}))
const useStyles = createStyles(({ responsive }) => ({
  panel: {
    padding: 20, background: '#e6f4ff', color: '#0958d9',
    [responsive.tablet]: { background: '#f6ffed', color: '#237804' },
    [responsive.desktop]: { background: '#fff0f6', color: '#c41d7f' },
    [responsive.mobile]: { background: '#fffbe6', color: '#874d00' },
  },
}))
const Preview = defineComponent({
  setup() {
    const s = useStyles()
    const screens = useResponsive()
    return () => h('div', {
      class: props.static ? staticStyles.panel : s.styles.panel,
      'data-testid': 'responsive-styles',
    }, props.static ? 'Static media queries' :
      screens.mobile ? 'mobile' : screens.desktop ? 'desktop' : screens.laptop ? 'laptop' : 'tablet')
  },
})
</script>

<template>
  <div class="docs-demo"><div class="docs-demo__stage"><ThemeProvider><Preview /></ThemeProvider></div></div>
</template>
