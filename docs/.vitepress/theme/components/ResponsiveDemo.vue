<script setup lang="ts">
import { computed } from 'vue'
import { useResponsive } from 'antdv-style'

const screens = useResponsive()
const entries = computed(() => Object.entries(screens))
</script>

<template>
  <ClientOnly>
    <div class="docs-demo">
      <div class="docs-demo__stage">
        <div class="demo-row">
          <span
            v-for="[name, active] in entries"
            :key="name"
            :style="{
              padding: '6px 10px',
              borderRadius: '6px',
              color: active ? '#fff' : 'var(--vp-c-text-2)',
              background: active ? '#1677ff' : 'var(--vp-c-bg-alt)',
            }"
          >
            {{ name }}
          </span>
        </div>
      </div>
      <div class="docs-demo__caption">Resize the viewport to see active breakpoints update.</div>
    </div>
  </ClientOnly>
</template>
