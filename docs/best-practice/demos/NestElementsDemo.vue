<script setup>
import { defineComponent, h } from 'vue'
import { ConfigProvider } from 'antdv-next'
import { ThemeProvider, createStyles } from 'antdv-style'

const useStyles = createStyles(({ css }) => {
  const child = css`
    background: #ff4d4f;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    flex-shrink: 0;
    transition: background 0.3s;
  `

  // Use css() function call (not tagged template) so ${child} is a plain string selector
  const parent = css(`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #d9d9d9;
    cursor: pointer;

    &:hover .${child} {
      background: #1677ff;
    }
  `)

  return { parent, child }
})

const Inner = defineComponent({
  setup() {
    const s = useStyles()
    return () => h('div', { class: s.styles.parent }, [
      h('div', { class: s.styles.child }),
      h('div', [
        h('p', { style: 'font-weight: 600; margin: 0 0 4px;' }, 'hover 试试'),
        h('p', { style: 'font-size: 13px; color: #999; margin: 0;' }, '父容器 hover 时，红色方块变蓝'),
      ]),
    ])
  },
})
</script>

<template>
  <ConfigProvider>
    <ThemeProvider>
      <Inner />
    </ThemeProvider>
  </ConfigProvider>
</template>
