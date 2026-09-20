<script setup lang="ts">
import { defineComponent, h, onMounted, ref, shallowRef } from 'vue'
import { createStyles, StyleProvider, ThemeProvider } from 'antdv-style'

const container = shallowRef<HTMLDivElement | null>(null)
const insertionPoint = shallowRef<HTMLMetaElement | null>(null)
const speedy = ref(false)
const ready = ref(false)
onMounted(() => { ready.value = true })
const useStyles = createStyles({ box: { color: 'rgb(10, 100, 90)', padding: 16, border: '1px solid currentColor' } })
const Preview = defineComponent({
  setup() {
    const s = useStyles()
    return () => h('div', { class: s.styles.box, 'data-testid': 'engine-box' }, 'Scoped styles')
  },
})
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <label><input v-model="speedy" type="checkbox" data-testid="speedy"> Speedy</label>
      <div ref="container" data-testid="engine-container">
        <meta ref="insertionPoint" data-testid="insertion-point">
      </div>
      <StyleProvider
        v-if="ready && container && insertionPoint" :key="String(speedy)"
        cache-key="container-proof" :container="container" :speedy="speedy"
        :insertion-point="insertionPoint" nonce="local-proof"
      >
        <ThemeProvider><Preview /></ThemeProvider>
      </StyleProvider>
    </div>
  </div>
</template>
