<script setup lang="ts">
import { shallowRef } from 'vue'
import { Button } from 'antdv-next'
import { ThemeProvider, type StaticInstance } from 'antdv-style'

const instances = shallowRef<StaticInstance>()

function onStaticInstance(value: StaticInstance) {
  instances.value = value
}
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <ThemeProvider theme-mode="dark" :get-static-instance="onStaticInstance">
        <Button type="primary" @click="instances?.message.success('Theme-aware message')">
          Show message
        </Button>
      </ThemeProvider>
    </div>
    <div class="docs-demo__caption">Capture provider-bound message, notification, and modal instances.</div>
  </div>
</template>
