<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import { ThemeProvider, createStyles } from 'antdv-style'

const dark = ref(false)
const value = ref(12312)
const layouts = ['inline', 'vertical', 'horizontal'] as const
const useStyles = createStyles(({ token }, props: { layout: string }) => ({
  statistic: {
    display: props.layout === 'inline' ? 'inline-flex' : 'flex',
    flexDirection: props.layout === 'vertical' ? 'column' : 'row',
    alignItems: props.layout === 'vertical' ? 'flex-start' : 'baseline',
    gap: 8, padding: 16, borderRadius: 4,
    color: token.colorText, background: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}`,
  },
  value: { fontSize: 24, fontWeight: 600, color: token.colorSuccess },
}))
const Statistic = defineComponent({
  props: { layout: { type: String, required: true } },
  setup(props) {
    const s = useStyles(() => ({ layout: props.layout }))
    return () => h('div', { class: s.styles.statistic, 'data-testid': `migration-${props.layout}` }, [
      h('span', props.layout), h('strong', { class: s.styles.value }, value.value.toLocaleString('en-US')),
    ])
  },
})
</script>

<template>
  <div class="docs-demo" data-example="migration">
    <div class="docs-demo__stage">
      <div class="demo-row">
        <label><input v-model="dark" type="checkbox"> Dark</label>
        <label>Value <input v-model.number="value" type="number" min="0" max="999999"></label>
      </div>
      <h4>Before: static CSS</h4>
      <div class="migration-row">
        <div v-for="layout in layouts" :key="layout" class="migration-before" :data-layout="layout">
          <span>{{ layout }}</span><strong>{{ value.toLocaleString('en-US') }}</strong>
        </div>
      </div>
      <h4>After: createStyles + theme</h4>
      <ThemeProvider :theme-mode="dark ? 'dark' : 'light'">
        <div class="migration-row"><Statistic v-for="layout in layouts" :key="layout" :layout="layout" /></div>
      </ThemeProvider>
    </div>
  </div>
</template>

<style scoped>
.migration-row { display: flex; flex-wrap: wrap; gap: 12px; }
.migration-before { display: flex; align-items: baseline; gap: 8px; padding: 16px; border-radius: 4px; color: #222; background: #fff; border: 1px solid #d9d9d9; }
.migration-before[data-layout="vertical"] { flex-direction: column; align-items: flex-start; }
.migration-before[data-layout="inline"] { display: inline-flex; }
.migration-before strong { font-size: 24px; font-weight: 600; color: #389e0d; }
</style>
