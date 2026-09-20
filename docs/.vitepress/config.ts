import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

const zhGuide = [
  {
    text: '基础知识',
    items: [
      { text: '简介', link: '/guide/' },
      { text: 'CSS in JS 快速入门', link: '/guide/css-in-js-intro' },
      { text: 'CSS in JS 写法对比', link: '/guide/compare' },
      { text: '设计理念与实施策略', link: '/guide/strategy' },
    ],
  },
  {
    text: '快速上手',
    items: [
      { text: '快速开始', link: '/guide/quick-start' },
      { text: '书写样式', link: '/guide/create-styles' },
      { text: '切换主题', link: '/guide/switch-theme' },
      { text: '自定义主题', link: '/guide/custom-theme' },
    ],
  },
  {
    text: '进阶使用',
    items: [
      { text: '组件研发', link: '/guide/components-usage' },
      { text: 'SSR 集成', link: '/guide/ssr' },
      { text: 'stylish 复合样式', link: '/guide/stylish' },
      { text: 'styled 生态说明', link: '/guide/styled' },
      { text: '编译期插件说明', link: '/guide/babel-plugin' },
      { text: 'CSS-in-JS 性能', link: '/guide/performance-comparsion' },
    ],
  },
  {
    text: '从 Less 迁移',
    items: [
      { text: '自动化迁移', link: '/guide/migrate-less-codemod' },
      { text: '应用手动迁移', link: '/guide/migrate-less-application' },
      { text: '组件迁移', link: '/guide/migrate-less-component' },
      { text: '编译差异', link: '/guide/cssinjs-compiler-difference' },
    ],
  },
]

const enGuide = [
  {
    text: 'Fundamentals',
    items: [
      { text: 'Introduction', link: '/en/guide/' },
      { text: 'CSS in JS Primer', link: '/en/guide/css-in-js-intro' },
      { text: 'Approach Comparison', link: '/en/guide/compare' },
      { text: 'Design Strategy', link: '/en/guide/strategy' },
    ],
  },
  {
    text: 'Getting Started',
    items: [
      { text: 'Quick Start', link: '/en/guide/quick-start' },
      { text: 'Writing Styles', link: '/en/guide/create-styles' },
      { text: 'Theme Switching', link: '/en/guide/switch-theme' },
      { text: 'Custom Themes', link: '/en/guide/custom-theme' },
    ],
  },
  {
    text: 'Advanced',
    items: [
      { text: 'Component Libraries', link: '/en/guide/components-usage' },
      { text: 'SSR Integration', link: '/en/guide/ssr' },
      { text: 'Reusable Stylish Presets', link: '/en/guide/stylish' },
      { text: 'Styled Ecosystem', link: '/en/guide/styled' },
      { text: 'Build-time Plugins', link: '/en/guide/babel-plugin' },
      { text: 'Performance', link: '/en/guide/performance-comparsion' },
    ],
  },
  {
    text: 'Migrating from Less',
    items: [
      { text: 'Automated Migration', link: '/en/guide/migrate-less-codemod' },
      { text: 'Application Migration', link: '/en/guide/migrate-less-application' },
      { text: 'Component Migration', link: '/en/guide/migrate-less-component' },
      { text: 'Compiler Differences', link: '/en/guide/cssinjs-compiler-difference' },
    ],
  },
]

const apiSidebar = (prefix = '') => {
  const zh = prefix === ''
  return [
    {
      text: zh ? '创建样式' : 'Creating Styles',
      items: [
        { text: 'createStyles', link: `${prefix}/api/create-styles` },
        { text: 'createStaticStyles', link: `${prefix}/api/create-static-styles` },
        { text: 'createGlobalStyle', link: `${prefix}/api/global-styles` },
        { text: 'createStylish', link: `${prefix}/api/create-stylish` },
      ],
    },
    {
      text: zh ? '容器组件' : 'Providers',
      items: [
        { text: 'ThemeProvider', link: `${prefix}/api/theme-provider` },
        { text: 'StyleProvider', link: `${prefix}/api/style-provider` },
      ],
    },
    {
      text: zh ? '组合式函数' : 'Composables',
      items: [
        { text: 'useTheme', link: `${prefix}/api/use-theme` },
        { text: 'useThemeMode', link: `${prefix}/api/use-theme-mode` },
        { text: 'useResponsive', link: `${prefix}/api/use-responsive` },
        { text: 'useAntdToken', link: `${prefix}/api/use-antd-token` },
        { text: 'useAntdTheme', link: `${prefix}/api/use-antd-theme` },
        { text: 'useAntdStylish', link: `${prefix}/api/use-antd-stylish` },
      ],
    },
    {
      text: zh ? '工具与服务端渲染' : 'Utilities and SSR',
      items: [
        { text: 'css / cx / keyframes', link: `${prefix}/api/css-utilities` },
        { text: 'CSS Variables', link: `${prefix}/api/css-variables` },
        { text: 'Responsive Utilities', link: `${prefix}/api/responsive-utilities` },
        { text: 'extractStaticStyle', link: `${prefix}/api/extract-static-style` },
        { text: zh ? '样式转换器' : 'Transformers', link: `${prefix}/api/transformers` },
      ],
    },
    {
      text: zh ? '高级设置' : 'Advanced',
      items: [
        { text: 'createInstance', link: `${prefix}/api/create-instance` },
        { text: 'createCacheManager', link: `${prefix}/api/cache-manager` },
        { text: 'setupStyled', link: `${prefix}/api/setup-styled` },
      ],
    },
  ]
}

const bestPracticeSidebar = (prefix = '') => {
  const zh = prefix === ''
  return [
    {
      text: zh ? '主题定制' : 'Theming',
      items: [
        { text: zh ? '概览' : 'Overview', link: `${prefix}/best-practice/` },
        { text: zh ? '扩展自定义 Token 类型' : 'Custom Token Types', link: `${prefix}/best-practice/custom-token-types` },
        { text: zh ? '自定义组件样式' : 'Component Overrides', link: `${prefix}/best-practice/antd-override` },
        { text: zh ? '静态方法响应主题' : 'Themed Static APIs', link: `${prefix}/best-practice/static-message` },
        { text: zh ? '解决主题切换 FOUC' : 'Avoid Theme FOUC', link: `${prefix}/best-practice/fix-switch-theme-fouc` },
      ],
    },
    {
      text: zh ? '样式书写' : 'Styling Patterns',
      items: [
        { text: zh ? '父子联动样式' : 'Parent-child Styling', link: `${prefix}/best-practice/nest-element-style` },
        { text: zh ? '迁移全局覆盖样式' : 'Migrating Global Overrides', link: `${prefix}/best-practice/mirgration-less-global-style` },
        { text: zh ? '性能优化' : 'Performance', link: `${prefix}/best-practice/performance` },
      ],
    },
    {
      text: zh ? '组件库研发' : 'Library Development',
      items: [
        { text: zh ? '封装 antdv-next 组件' : 'Wrapping antdv-next', link: `${prefix}/best-practice/antd-based-components` },
        { text: zh ? 'styled 迁移建议' : 'Migrating from styled', link: `${prefix}/best-practice/styled` },
      ],
    },
    {
      text: zh ? '样式案例' : 'Showcases',
      items: [
        { text: zh ? '黏土风 UI' : 'Clay UI', link: `${prefix}/best-practice/clay` },
        { text: zh ? 'macOS 风格选择器' : 'macOS-style Select', link: `${prefix}/best-practice/mac-select` },
      ],
    },
  ]
}

const logo = 'https://gw.alipayobjects.com/zos/hitu-asset/c88e3678-6900-4289-8538-31367c2d30f2/hitu-1609235995955-image.png'
const sharedThemeConfig = {
  logo,
  search: { provider: 'local' as const },
  outline: { level: [2, 3] as [number, number] },
  socialLinks: [
    { icon: 'github' as const, link: 'https://github.com/antdv-next/antdv-style' },
  ],
  editLink: {
    pattern: 'https://github.com/antdv-next/antdv-style/edit/main/docs/:path',
  },
}

export default defineConfig({
  title: 'Antdv Style',
  description: 'CSS-in-JS solution for antdv-next',
  base: '/antdv-style/',
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['superpowers/**'],
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: logo }],
    ['meta', { name: 'theme-color', content: '#1677ff' }],
  ],
  markdown: {
    theme: { light: 'github-light', dark: 'one-dark-pro' },
    lineNumbers: true,
  },
  vite: {
    resolve: {
      alias: {
        'antdv-style': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      },
    },
    ssr: {
      noExternal: ['antdv-next', /^@v-c\//, '@antdv-next/cssinjs'],
    },
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        ...sharedThemeConfig,
        nav: [
          { text: '首页', link: '/' },
          { text: '快速上手', link: '/guide/' },
          { text: '最佳实践', link: '/best-practice/' },
          { text: 'API', link: '/api/create-styles' },
          { text: '更新日志', link: '/changelog' },
        ],
        sidebar: {
          '/guide/': zhGuide,
          '/api/': apiSidebar(),
          '/best-practice/': bestPracticeSidebar(),
        },
        docFooter: { prev: '上一篇', next: '下一篇' },
        lastUpdated: { text: '最后更新于' },
        editLink: { ...sharedThemeConfig.editLink, text: '在 GitHub 上编辑此页' },
        footer: {
          message: '基于 MIT 许可发布',
          copyright: 'Copyright © 2026 antdv-next contributors',
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        ...sharedThemeConfig,
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Guide', link: '/en/guide/' },
          { text: 'Best Practices', link: '/en/best-practice/' },
          { text: 'API', link: '/en/api/create-styles' },
          { text: 'Changelog', link: '/en/changelog' },
        ],
        sidebar: {
          '/en/guide/': enGuide,
          '/en/api/': apiSidebar('/en'),
          '/en/best-practice/': bestPracticeSidebar('/en'),
        },
        editLink: { ...sharedThemeConfig.editLink, text: 'Edit this page on GitHub' },
        footer: {
          message: 'Released under the MIT License',
          copyright: 'Copyright © 2026 antdv-next contributors',
        },
      },
    },
  },
})
