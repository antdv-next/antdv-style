---
layout: home

hero:
  name: Antdv Style
  text: CSS-in-JS for antdv-next
  tagline: antdv-next 的 CSS-in-JS 解决方案
  actions:
    - theme: brand
      text: 快速上手
      link: /guide/quick-start
    - theme: alt
      text: API 参考
      link: /api/create-styles

features:
  - title: Token 系统
    details: 自动集成 antdv-next ConfigProvider 提供的 500+ 设计 Token
  - title: 暗色模式
    details: 支持 light / dark / auto 三种模式，可跟随系统偏好自动切换，也可编程控制
  - title: CSS 变量
    details: cssVar.colorPrimary → var(--ant-color-primary)，支持自定义前缀回退
  - title: 响应式
    details: Token 驱动的断点工具，支持可调用的工具函数与设备别名
  - title: 多实例
    details: createInstance() 为微前端场景提供隔离的 Emotion 缓存
  - title: TypeScript
    details: 通过模块扩展为自定义 Token 提供完整的 IntelliSense 支持
---
