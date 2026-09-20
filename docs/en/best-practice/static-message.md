# Theme-aware Static APIs

Message, notification, and modal instances must live inside the active Vue provider tree to consume its theme.

<StaticMessageDemo />

`ThemeProvider.getStaticInstance` runs after mount with all three APIs:

```ts
import { shallowRef } from 'vue'
import type { StaticInstance } from 'antdv-style'

export const feedback = shallowRef<StaticInstance>()

export function setFeedback(value: StaticInstance) {
  feedback.value = value
}
```

```vue
<ThemeProvider :get-static-instance="setFeedback">
  <App />
</ThemeProvider>
```

Callers outside components must handle the pre-mount state. Multiple root applications should keep separate instances rather than overwriting a process-global singleton.
