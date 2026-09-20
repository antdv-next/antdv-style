# Avoiding Theme FOUC

A flash occurs when static or server HTML paints in light mode before Vue starts and resolves automatic dark mode.

## Recommended flow

1. Resolve a saved appearance from a cookie on the server.
2. Run a tiny bootstrap script before application scripts to set `data-theme` on `<html>`.
3. Provide first-paint background and `color-scheme` CSS for that attribute.
4. Let `themeMode="auto"` observe system changes after hydration.

```html
<script>
  const saved = localStorage.getItem('theme')
  const dark = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
</script>
```

Strict CSP deployments should use a nonce or an allowed static script instead of weakening the policy. SSR pages should also inject the tags returned by [`extractStaticStyle`](/en/api/extract-static-style).
