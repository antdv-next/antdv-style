import { createInstance } from '../index'
import { h } from 'vue'

interface BrandToken {
  brandColor: string
  headerHeight: number
}

const style = createInstance<BrandToken>({
  customToken: {
    brandColor: '#1677ff',
    headerHeight: 56,
  },
})

h(style.ThemeProvider, { theme: { cssVar: true } })
h(style.ThemeProvider, { theme: { cssVar: { prefix: 'brand' } } })

style.createStyles(({ token }) => {
  const brandColor: string = token.brandColor
  const headerHeight: number = token.headerHeight
  return { root: { color: brandColor, height: headerHeight } }
})

const theme = style.useTheme()
const brandColor: string = theme.value.brandColor
void brandColor

createInstance<BrandToken>({
  // @ts-expect-error BrandToken requires headerHeight.
  customToken: { brandColor: '#1677ff' },
})
