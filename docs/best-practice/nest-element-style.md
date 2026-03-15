# 父子级联样式

有时你需要在鼠标悬停父容器时改变子元素的样式。

## 演示

<script setup>
import NestElementsDemo from './demos/NestElementsDemo.vue'
</script>

<NestElementsDemo />

## 核心代码

```typescript
const useStyles = createStyles(({ css }) => {
  // 1. 用 css`` 生成子元素的 class name
  const child = css`
    background: #ff4d4f;
    width: 100px;
    height: 100px;
  `

  return {
    // 2. 父元素使用 css() 函数调用（而非模板标签！），
    //    这样 ${child} 会被插值为普通选择器字符串
    parent: css(`
      cursor: pointer;

      &:hover .${child} {
        background: #1677ff;
      }
    `),
    child,
  }
})
```

::: warning
当需要将 class name 用作选择器进行插值时，请使用 `css()` **函数调用**，而不是 `` css`...` `` 模板标签。模板标签会导致 Emotion 将插值视为样式组合，而不是字面量字符串。
:::

## 工作原理

1. `` css` ` `` 返回一个 class name 字符串（例如 `antdv-css-abc123`）
2. `css()` 函数调用使用普通模板字符串，将 `${child}` 视为普通字符串插值
3. 生成的 CSS 规则：`.parent:hover .antdv-css-abc123 { background: #1677ff }`

## 模板中的用法

```vue
<template>
  <div :class="s.styles.parent">
    <div :class="s.styles.child" />
    <span>悬停以改变颜色</span>
  </div>
</template>
```
