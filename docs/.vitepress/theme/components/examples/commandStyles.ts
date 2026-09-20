import { createStyles } from 'antdv-style'

export const useCommandStyles = createStyles(({ token }) => ({
  menu: { display: 'grid', gap: 4, padding: 12, background: token.colorBgContainer },
  item: {
    display: 'flex', justifyContent: 'space-between', gap: 16,
    padding: '10px 12px', textAlign: 'left', borderRadius: 4,
    color: token.colorText, background: 'transparent', cursor: 'pointer',
    '&:hover, &:focus-visible': { background: token.colorFillSecondary },
  },
  selected: { background: token.colorPrimaryBg, color: token.colorPrimary },
}))
