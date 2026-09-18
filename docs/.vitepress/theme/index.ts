import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import AntdOverrideDemo from './components/AntdOverrideDemo.vue'
import CreateStylesDemo from './components/CreateStylesDemo.vue'
import ResponsiveDemo from './components/ResponsiveDemo.vue'
import StaticMessageDemo from './components/StaticMessageDemo.vue'
import StaticStylesDemo from './components/StaticStylesDemo.vue'
import ThemeSwitchDemo from './components/ThemeSwitchDemo.vue'
import MacSelectDemo from './components/MacSelectDemo.vue'
import ClayDemo from './components/ClayDemo.vue'
import StyleEngineDemo from './components/StyleEngineDemo.vue'
import CustomThemeDemo from './components/CustomThemeDemo.vue'
import BenchmarkDemo from './components/BenchmarkDemo.vue'
import CreateStylesVariantsDemo from './components/CreateStylesVariantsDemo.vue'
import MigrationComparisonDemo from './components/MigrationComparisonDemo.vue'
import RuntimeCapabilitiesDemo from './components/RuntimeCapabilitiesDemo.vue'
import ThemeVariantsDemo from './components/ThemeVariantsDemo.vue'
import OverrideVariantsDemo from './components/OverrideVariantsDemo.vue'
import ResponsiveStylesDemo from './components/ResponsiveStylesDemo.vue'
import DynamicBenchmarkDemo from './components/DynamicBenchmarkDemo.vue'
import ThemeCompositionDemo from './components/ThemeCompositionDemo.vue'
import './styles.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AntdOverrideDemo', AntdOverrideDemo)
    app.component('CreateStylesDemo', CreateStylesDemo)
    app.component('ResponsiveDemo', ResponsiveDemo)
    app.component('StaticMessageDemo', StaticMessageDemo)
    app.component('StaticStylesDemo', StaticStylesDemo)
    app.component('ThemeSwitchDemo', ThemeSwitchDemo)
    app.component('MacSelectDemo', MacSelectDemo)
    app.component('ClayDemo', ClayDemo)
    app.component('StyleEngineDemo', StyleEngineDemo)
    app.component('CustomThemeDemo', CustomThemeDemo)
    app.component('BenchmarkDemo', BenchmarkDemo)
    app.component('CreateStylesVariantsDemo', CreateStylesVariantsDemo)
    app.component('MigrationComparisonDemo', MigrationComparisonDemo)
    app.component('RuntimeCapabilitiesDemo', RuntimeCapabilitiesDemo)
    app.component('ThemeVariantsDemo', ThemeVariantsDemo)
    app.component('OverrideVariantsDemo', OverrideVariantsDemo)
    app.component('ResponsiveStylesDemo', ResponsiveStylesDemo)
    app.component('DynamicBenchmarkDemo', DynamicBenchmarkDemo)
    app.component('ThemeCompositionDemo', ThemeCompositionDemo)
  },
} satisfies Theme
