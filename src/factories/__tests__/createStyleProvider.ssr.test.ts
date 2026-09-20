// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, shallowRef } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createCache, createTheme, useStyleContext, useStyleRegister } from '@antdv-next/cssinjs'
import { createInstance } from '../../functions/createInstance'
import { extractStaticStyle } from '../../functions/extractStaticStyle'

describe('StyleProvider SSR compatibility', () => {
  it.each([false, true])('forwards ssrInline=%s while requiring explicit extraction', async (ssrInline) => {
    const instance = createInstance({ key: 'ssr-inline' })
    const antdCache = createCache()
    let forwarded: boolean | undefined
    const Child = defineComponent({
      setup() {
        forwarded = useStyleContext().value.ssrInline
        useStyleRegister(shallowRef({
          theme: createTheme(token => token),
          token: { _tokenKey: 'ssr-inline-probe' },
          path: ['ssr-inline-probe'],
        }), () => ({ '.ssr-inline-probe': { color: 'plum' } }))
        const className = instance.css({ padding: 12 })
        return () => h('div', { class: ['ssr-inline-probe', className] }, 'SSR')
      },
    })

    try {
      const html = await renderToString(createSSRApp({
        render: () => h(instance.StyleProvider, { antdCache, ssrInline }, {
          default: () => h(Child),
        }),
      }))
      expect(forwarded).toBe(ssrInline)
      expect(html).not.toContain('<style')
      const extracted = extractStaticStyle(instance.styleManager, { html, antdCache })
      expect(extracted.css).toContain('.ssr-inline-probe{color:plum;}')
      expect(extracted.css).toContain('padding:12px')
      expect(extracted.tags).toContain('data-css-hash=')
      expect(extracted.tags).toContain('data-emotion="ssr-inline ')
    } finally {
      instance.dispose()
    }
  })
})
