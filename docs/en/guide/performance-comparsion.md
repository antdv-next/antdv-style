# CSS-in-JS Performance

## Dynamic Values and Long Lists

<DynamicBenchmarkDemo />

<BenchmarkDemo />

This local microbenchmark measures Emotion rule generation and repeated calls in the current browser. It does not measure page rendering or compare React, Vue or other libraries. Timings depend on the device, development mode and sampling noise.

The important difference is when styles are generated.

`createStyles` reads injected theme state and props, then caches the generated classes for equivalent inputs. Use it for dynamic themes and component props.

`createStaticStyles` generates classes once at module evaluation time. It creates no Vue effects and can still follow themes through CSS variables.

| Scenario | Recommended API |
|---|---|
| Component props | `createStyles` |
| Appearance-specific rules | `createStyles` |
| CSS variables only | `createStaticStyles` |
| Large repeated lists | `createStaticStyles` |
| Document reset | `createGlobalStyle` |

Start with maintainable `createStyles` code, then profile real component counts before moving hot paths.

<StaticStylesDemo />
