<script setup lang="ts">
import { defineComponent, h, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { createInstance, type CreateInstanceResult } from 'antdv-style'

const position = ref(16)
const count = ref(100)
const engine = shallowRef<CreateInstanceResult>()
const Preview = shallowRef<ReturnType<typeof defineComponent>>()
onMounted(() => {
  const instance = createInstance({ key: 'dynamic-benchmark', speedy: true })
  engine.value = instance
  const useStyles = instance.createStyles((_utils, props: { left: number }) => ({
    box: { paddingLeft: props.left, borderLeft: '2px solid #1677ff', margin: '4px 0' },
  }))
  Preview.value = defineComponent({
    setup() {
      const s = useStyles(() => ({ left: position.value }))
      return () => h('div', { 'data-testid': 'dynamic-list' },
        Array.from({ length: count.value }, (_, index) => h('div', { class: s.styles.box }, `Row ${index + 1}`)))
    },
  })
})
onUnmounted(() => engine.value?.dispose())
</script>

<template>
  <div class="docs-demo" data-example="dynamic-benchmark">
    <div class="docs-demo__stage">
      <div class="demo-row">
        <label>Padding <input v-model.number="position" type="range" min="0" max="48"></label>
        <label>Rows <input v-model.number="count" type="range" min="100" max="1000" step="100"></label>
        <output>{{ count }}</output>
      </div>
      <div style="height: 240px; overflow: auto">
        <component :is="engine.ThemeProvider" v-if="engine && Preview"><component :is="Preview" /></component>
      </div>
    </div>
  </div>
</template>
