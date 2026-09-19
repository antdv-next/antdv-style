# createCacheManager

`reset()` immediately flushes the engine's styles. Remounting a `createStyles` consumer reinserts its rules even with unchanged arguments. Reset does not rerender mounted consumers; do not call it on a currently displayed page.

`createCacheManager` creates an extractable and resettable view of an Emotion instance.

```ts
const instance = createInstance({ key: 'preview' })
const manager = createCacheManager(instance.styleManager)
```

| Member | Description |
|---|---|
| `getStyles(html?)` | Return collected CSS text; on the server, optional HTML limits output to critical styles |
| `getStyleTags(html?)` | Return a complete Emotion style tag with the same optional HTML filtering |
| `reset()` | Clear tracking and flush Emotion |
| `emotion` | The managed Emotion instance |

Calls for the same cache reuse the same manager. Most applications should use [`extractStaticStyle`](/en/api/extract-static-style) instead.

Browser `createGlobalStyle` sheets belong to their engine too. Collection preserves
their DOM order relative to ordinary sheets; `reset()` and engine `flush()` clear
both without affecting another instance. Unmounting unregisters the hook's sheet.
Reset does not stop mounted global hooks: a later theme or reactive dependency
change may insert their styles again.

Both SSR and browser collection put the main Emotion sheet first, followed by
global hooks in mount order. Ordinary rules are grouped into the main sheet;
empty global owners retain an SSR marker so hydration can recover their position.

In browser speedy mode, the manager reads CSS from CSSOM `cssRules`. If browser security rules prevent access, it safely returns an empty string. Server-generated tags preserve the CSP nonce configured on the Emotion cache.
