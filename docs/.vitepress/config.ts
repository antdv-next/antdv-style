import { defineConfig } from 'vitepress'

const guideSidebar = (prefix = '') => [
  {
    text: prefix ? 'Getting Started' : '快速上手',
    items: [
      { text: prefix ? 'Introduction' : '介绍', link: `${prefix}/guide/` },
      { text: prefix ? 'Quick Start' : '快速开始', link: `${prefix}/guide/quick-start` },
    ],
  },
  {
    text: prefix ? 'Styling' : '样式书写',
    items: [
      { text: 'createStyles', link: `${prefix}/guide/create-styles` },
      { text: prefix ? 'Theme Customization' : '主题定制', link: `${prefix}/guide/custom-theme` },
      { text: prefix ? 'Dark Mode' : '暗色模式', link: `${prefix}/guide/switch-theme` },
    ],
  },
]

const apiSidebar = (prefix = '') => [
  {
    text: prefix ? 'Style Factories' : '样式工厂',
    items: [
      { text: 'createStyles', link: `${prefix}/api/create-styles` },
      { text: 'createGlobalStyle', link: `${prefix}/api/global-styles` },
      { text: 'createStylish', link: `${prefix}/api/create-stylish` },
      { text: 'createStaticStyles', link: `${prefix}/api/create-static-styles` },
    ],
  },
  {
    text: prefix ? 'Components' : '组件',
    items: [
      { text: 'ThemeProvider', link: `${prefix}/api/theme-provider` },
      { text: 'StyleProvider', link: `${prefix}/api/style-provider` },
    ],
  },
  {
    text: 'Composables',
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
    text: prefix ? 'Advanced' : '进阶',
    items: [
      { text: 'createInstance', link: `${prefix}/api/create-instance` },
    ],
  },
]

const bestPracticeSidebar = (prefix = '') => [
  {
    text: prefix ? 'Style Patterns' : '样式模式',
    items: [
      { text: prefix ? 'Overview' : '概览', link: `${prefix}/best-practice/` },
      { text: prefix ? 'Parent-Child Cascading' : '父子联动样式', link: `${prefix}/best-practice/nest-element-style` },
    ],
  },
]

export default defineConfig({
  title: 'Antdv Style',
  description: 'antdv-next 的 CSS-in-JS 解决方案',
  base: '/antdv-style/',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: 'https://avatars.githubusercontent.com/u/178967077?s=200&v=4' }],
  ],

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
    },
    en: {
      label: 'English',
      lang: 'en',
      description: 'CSS-in-JS solution for antdv-next',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/' },
          { text: 'API', link: '/en/api/create-styles' },
          { text: 'Best Practices', link: '/en/best-practice/' },
          { text: 'antdv-next', link: 'https://github.com/antdv-next/antdv-next' },
        ],
        sidebar: {
          '/en/guide/': guideSidebar('/en'),
          '/en/api/': apiSidebar('/en'),
          '/en/best-practice/': bestPracticeSidebar('/en'),
        },
      },
    },
  },

  themeConfig: {
    logo: 'https://avatars.githubusercontent.com/u/178967077?s=200&v=4',
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/create-styles' },
      { text: '最佳实践', link: '/best-practice/' },
      { text: 'antdv-next', link: 'https://github.com/antdv-next/antdv-next' },
    ],

    sidebar: {
      '/guide/': guideSidebar(),
      '/api/': apiSidebar(),
      '/best-practice/': bestPracticeSidebar(),
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/antdv-next/antdv-style' },
    ],
  },
})
