# 让静态方法响应主题

`message`、`notification` 和 `modal` 需要位于当前 Vue Provider 树中，才能消费主题。不要在模块顶层直接创建脱离上下文的 UI。

## 获取绑定实例

`ThemeProvider` 的 `getStaticInstance` 会在挂载后返回三组 API：

<StaticMessageDemo />

```ts
// feedback.ts
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

在请求层或 store 中使用前要处理尚未挂载的状态：

```ts
feedback.value?.message.error('Request failed')
```

多个根应用应各自保存实例，不要让后挂载应用覆盖全局单例。
