// Explicit Ant Design v4 -> v5 mappings, never infer arbitrary variable names.
export const tokenNames: Record<string, string> = {
  'primary-color': 'colorPrimary', 'success-color': 'colorSuccess',
  'warning-color': 'colorWarning', 'error-color': 'colorError',
  'text-color': 'colorText', 'heading-color': 'colorTextHeading',
  'text-color-secondary': 'colorTextSecondary', 'disabled-color': 'colorTextDisabled',
  'border-color-base': 'colorBorder', 'border-color-split': 'colorSplit',
  'component-background': 'colorBgContainer', 'layout-body-background': 'colorBgLayout',
  'input-bg': 'colorBgContainer', 'menu-bg': 'colorBgContainer',
  'bg': 'colorBgContainer', 'descriptions-bg': 'colorBgContainer',
  'highlight-color': 'colorBgTextActive', 'item-active-bg': 'colorBgTextActive',
  'item-hover-bg': 'colorBgElevated', 'select-item-selected-bg': 'colorBgElevated',
  'avatar-size-sm': 'controlHeightSM', 'avatar-size-lg': 'controlHeightLG',
  'avatar-size-base': 'controlHeight',
  'border-radius-base': 'borderRadius', 'border-width-base': 'lineWidth',
  'font-size-base': 'fontSize', 'btn-height-lg': 'controlHeight',
  'box-shadow-base': 'boxShadow',
  'screen-xs': 'screenXS', 'screen-sm': 'screenSM', 'screen-md': 'screenMD',
  'screen-lg': 'screenLG', 'screen-xl': 'screenXL', 'screen-md-min': 'screenMDMin',
}
export const lengths = new Set([
  'borderRadius', 'lineWidth', 'fontSize', 'controlHeight',
  'controlHeightSM', 'controlHeightLG',
  'screenXS', 'screenSM', 'screenMD', 'screenLG', 'screenXL', 'screenMDMin',
])

export function tokenExpression(value: string, forceString = false): string | undefined {
  const words = value.trim().split(/\s+/)
  const output: string[] = []
  for (const word of words) {
    if (!word.includes('@')) {
      output.push(JSON.stringify(word))
      continue
    }
    const match = /^@([\w-]+)$/.exec(word)
    if (match?.[1] === 'border-style-base') { output.push('"solid"'); continue }
    if (match?.[1] === 'tag-default-bg') { output.push('"#F9F9F9"'); continue }
    const token = match && Object.prototype.hasOwnProperty.call(tokenNames, match[1]) && tokenNames[match[1]]
    if (!token) return undefined
    output.push(`token.${token}${(forceString || words.length > 1) && lengths.has(token) ? ' + "px"' : ''}`)
  }
  return output.map(part => `(${part})`).join(' + " " + ')
}
