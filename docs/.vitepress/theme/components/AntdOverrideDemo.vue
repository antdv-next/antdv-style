<script setup lang="ts">
import { Button } from 'antdv-next'
import { ThemeProvider } from 'antdv-style'
</script>

<template>
  <div class="docs-demo">
    <div class="docs-demo__stage">
      <ThemeProvider :theme="{ token: { colorPrimary: '#d4380d', borderRadius: 4 } }">
        <div class="demo-row">
          <Button type="primary">Primary action</Button>
          <Button>Secondary action</Button>
        </div>
      </ThemeProvider>
    </div>
    <div class="docs-demo__caption">Prefer component tokens and ThemeProvider before selector overrides.</div>
  </div>
</template>
