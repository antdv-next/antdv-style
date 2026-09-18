<script setup lang="ts">
import { App } from 'antdv-next'
import { createStaticStyles, ThemeProvider } from 'antdv-style'

const styles = createStaticStyles(({ cssVar, responsive }) => ({
  banner: {
    padding: '18px 20px',
    borderRadius: 8,
    color: '#fff',
    background: cssVar.colorPrimary,
    [responsive.mobile]: { padding: 14 },
  },
}))
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <ThemeProvider>
        <App><div :class="styles.banner">Generated once, reused by every component instance.</div></App>
      </ThemeProvider>
    </div>
    <div class="docs-demo__caption">createStaticStyles is ideal for CSS-variable-driven styles.</div>
  </div>
</template>
