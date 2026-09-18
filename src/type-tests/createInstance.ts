import { createInstance } from '../index'

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
