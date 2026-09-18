<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { createInstance } from 'antdv-style'

const count = ref(100)
const running = ref(false)
const result = ref<{ cold: number; warm: number; coldRules: number; warmRules: number } | null>(null)
async function run() {
  running.value = true
  await nextTick()
  const instance = createInstance({ key: 'docs-benchmark', speedy: true })
  const iterations = count.value
  const generate = () => {
    const start = performance.now()
    for (let index = 0; index < iterations; index++) instance.css({ paddingLeft: index + 1 })
    return performance.now() - start
  }
  try {
    const cold = generate()
    const coldRules = Object.keys(instance.styleManager.cache.inserted).length
    const warm = generate()
    result.value = { cold, warm, coldRules, warmRules: Object.keys(instance.styleManager.cache.inserted).length }
  } finally {
    instance.dispose()
    running.value = false
  }
}
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <div class="demo-row">
        <label>Rules <input v-model.number="count" type="range" min="50" max="500" step="50" :disabled="running"></label>
        <output>{{ count }}</output>
        <button class="demo-button" :disabled="running" data-testid="benchmark-run" @click="run">Run</button>
      </div>
      <table v-if="result" data-testid="benchmark-result">
        <thead><tr><th>Pass</th><th>Time (ms)</th><th>Cached rules</th></tr></thead>
        <tbody>
          <tr><td>Cold</td><td>{{ result.cold.toFixed(2) }}</td><td data-testid="benchmark-cold-rules">{{ result.coldRules }}</td></tr>
          <tr><td>Repeated</td><td>{{ result.warm.toFixed(2) }}</td><td data-testid="benchmark-warm-rules">{{ result.warmRules }}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
