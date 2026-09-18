<script setup lang="ts">
import { defineComponent, h, onMounted, onUnmounted, ref, shallowRef, useId } from 'vue'
import { Button } from 'antdv-next'
import {
  createInstance, createCacheManager, type CreateInstanceResult,
} from 'antdv-style'

const props = defineProps<{ variant: 'instance' | 'global' | 'stylish' | 'theme' | 'label' | 'nested' | 'styled' }>()
const dark = ref(false)
const active = ref(false)
const visible = ref(true)
const extracted = ref('')
const id = `capability-${useId().replace(/:/g, '-')}`
const target = shallowRef<HTMLElement>()
const instance = shallowRef<CreateInstanceResult>()
const Preview = shallowRef<ReturnType<typeof defineComponent>>()
onMounted(() => {
  const engine = createInstance({
    key: 'docs-capability', container: props.variant === 'instance' ? target.value : undefined,
    customToken: { demoAccent: '#c41d7f' },
  })
  instance.value = engine
  const useStyles = engine.createStyles(({ token, prefixCls }, state: { active: boolean }) => ({
    box: {
      padding: 16, borderRadius: 4, border: `1px solid ${token.colorBorder}`,
      background: token.colorBgContainer, color: state.active ? token.colorPrimary : token.colorText,
      [`& .${prefixCls}-btn`]: { borderRadius: 4 },
    },
  }), { label: props.variant === 'label' ? 'DocsCard' : undefined })
  const useStylish = engine.createStylish(({ token }) => ({
    accent: { color: token.colorPrimary, borderBottom: `2px solid ${token.colorPrimary}` },
  }))
  const staticBox = engine.createStaticStyles(({ css }) => css({ padding: 12, border: '1px dashed #1677ff' }))
  const useGlobal = engine.createGlobalStyle(({ token }) => ({
    [`#${id} [data-global-target]`]: { color: token.colorPrimary, padding: 16, borderBottom: '2px solid currentColor' },
  }))
  Preview.value = defineComponent({
    setup() {
      const s = useStyles(() => ({ active: active.value }))
      const stylish = useStylish()
      const theme = engine.useTheme()
      if (props.variant === 'global') useGlobal()
      return () => h('div', { class: s.styles.box, 'data-testid': `capability-${props.variant}` }, [
        props.variant === 'global'
          ? h('div', { 'data-global-target': '' }, 'Global rule')
          : props.variant === 'instance'
            ? h('div', { class: staticBox, 'data-testid': 'instance-static' }, 'Instance static styles')
            : props.variant === 'stylish'
              ? h('span', { class: stylish.value.accent, 'data-testid': 'stylish-accent' }, 'Shared style preset')
              : props.variant === 'label'
                ? h('code', { style: { overflowWrap: 'anywhere' } }, s.styles.box)
                : h(Button, { type: 'primary' }, props.variant === 'styled' ? 'Vue styled button' : 'Theme-aware button'),
        h('output', { style: { display: 'block', marginTop: '12px', fontSize: '12px' } },
          `${theme.value.appearance} / ${theme.value.prefixCls} / ${theme.value.colorPrimary}`),
      ])
    },
  })
})
onUnmounted(() => instance.value?.dispose())
const collect = () => {
  if (instance.value) extracted.value = createCacheManager(instance.value.styleManager).getStyles()
}
</script>

<template>
  <div :id="id" class="docs-demo" :data-example="variant">
    <div class="docs-demo__stage">
      <div class="demo-row">
        <label><input v-model="dark" type="checkbox"> Dark</label>
        <label v-if="variant === 'styled'"><input v-model="active" type="checkbox"> Active</label>
        <label v-if="variant === 'global'"><input v-model="visible" type="checkbox"> Mounted</label>
        <button v-if="variant === 'global' || variant === 'instance'" class="demo-button" type="button" @click="collect">Collect CSS</button>
      </div>
      <div ref="target" data-testid="instance-style-container" />
      <component
        :is="instance.ThemeProvider" v-if="instance && Preview"
        :theme-mode="dark ? 'dark' : 'light'"
        :theme="{ token: { colorPrimary: active ? '#c41d7f' : '#1677ff' } }"
      >
        <component :is="Preview" v-if="visible" />
        <component
          :is="instance.ThemeProvider" v-if="variant === 'nested'"
          prefix-cls="nested" :theme="{ token: { colorPrimary: '#389e0d' } }"
        >
          <component :is="Preview" />
        </component>
      </component>
      <pre v-if="extracted" data-testid="collected-css" style="max-height: 180px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere">{{ extracted }}</pre>
    </div>
  </div>
</template>
