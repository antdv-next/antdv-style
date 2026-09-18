<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue'
import { Select } from 'antdv-next'
import { ThemeProvider, createStyles, keyframes } from 'antdv-style'
import { useCommandStyles } from './examples/commandStyles'

const props = defineProps<{ variant: 'static' | 'tokens' | 'props' | 'command' | 'keyframes' }>()
const dark = ref(false)
const primary = ref('#1677ff')
const selected = ref('2')
const open = ref(false)
const query = ref('')
const command = ref('Color picker')
const paused = ref(false)
const items = ['New project', 'Color picker', 'Brand assets', 'Optimize images', 'Translate']
const filtered = computed(() => items.filter(item => item.toLowerCase().includes(query.value.toLowerCase())))
const useStatic = createStyles({ box: { padding: 20, border: '1px solid #1677ff', color: '#1677ff', borderRadius: 4 } })
const useTokens = createStyles(({ css, token }) => {
  const common = css({ borderRadius: token.borderRadiusLG, padding: token.padding, border: `1px solid ${token.colorBorder}` })
  return {
    primary: css(common, { background: token.colorPrimary, color: token.colorTextLightSolid }),
    normal: css(common, { background: token.colorBgContainer, color: token.colorText }),
  }
})
const useSelect = createStyles(({ token, prefixCls }, state: { id: string; open: boolean }) => ({
  select: {
    width: 220, maxWidth: '100%', borderRadius: token.borderRadius,
    outline: `2px solid ${state.open ? token.colorSuccess : 'transparent'}`,
    [`&.${prefixCls}-select`]: {
      background: state.id === '1' ? token.colorPrimaryBg : token.colorBgContainer,
      color: state.id === '1' ? token.colorPrimary : token.colorText,
    },
  },
}))
const useMotion = createStyles(({ css }) => {
  const bounce = keyframes({ from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-16px)' } })
  return {
    helper: css({ animation: `${bounce} 1s ease-in-out infinite alternate` }),
    native: css({
      '@keyframes antdvDocsBounce': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-16px)' } },
      animation: 'antdvDocsBounce 1s ease-in-out infinite alternate',
    }),
  }
})
const Preview = defineComponent({
  setup() {
    const simple = useStatic()
    const token = useTokens()
    const select = useSelect(() => ({ id: selected.value, open: open.value }))
    const menu = useCommandStyles()
    const motion = useMotion()
    return () => {
      if (props.variant === 'static') return h('div', { class: simple.styles.box, 'data-testid': 'static-example' }, 'Static style object')
      if (props.variant === 'tokens') return h('div', { class: 'demo-row' }, [
        h('div', { class: token.styles.primary, 'data-testid': 'token-primary' }, 'Primary'),
        h('div', { class: token.styles.normal, 'data-testid': 'token-normal' }, 'Default'),
      ])
      if (props.variant === 'props') return h(Select, {
        value: selected.value, open: open.value, class: select.styles.select,
        'data-testid': 'props-select',
        options: ['1', '2', '3'].map(value => ({ value, label: `Option ${value}` })),
        'onUpdate:value': (value: unknown) => { selected.value = String(value) },
        onOpenChange: (value: boolean) => { open.value = value },
      })
      if (props.variant === 'command') return h('div', { class: menu.styles.menu }, filtered.value.map(item =>
        h('button', {
          type: 'button', class: menu.cx(menu.styles.item, item === command.value && menu.styles.selected),
          'aria-pressed': item === command.value, onClick: () => { command.value = item },
        }, item),
      ))
      return h('div', { class: 'demo-row', style: { paddingTop: '24px' } }, [
        h('span', { class: motion.styles.helper, 'data-testid': 'keyframes-helper', style: { animationPlayState: paused.value ? 'paused' : 'running' } }, 'keyframes()'),
        h('span', { class: motion.styles.native, 'data-testid': 'keyframes-native', style: { animationPlayState: paused.value ? 'paused' : 'running' } }, '@keyframes'),
      ])
    }
  },
})
</script>

<template>
  <div class="docs-demo" :data-example="variant">
    <div class="docs-demo__stage">
      <div v-if="variant === 'tokens'" class="demo-row">
        <label><input v-model="dark" type="checkbox"> Dark</label>
        <label>Primary <input v-model="primary" type="color" aria-label="Primary color"></label>
      </div>
      <label v-if="variant === 'command'">
        <input v-model="query" type="search" placeholder="Search commands" aria-label="Search commands">
      </label>
      <label v-if="variant === 'keyframes'"><input v-model="paused" type="checkbox"> Pause</label>
      <ThemeProvider :theme-mode="dark ? 'dark' : 'light'" :theme="{ token: { colorPrimary: primary } }">
        <Preview />
      </ThemeProvider>
    </div>
  </div>
</template>
