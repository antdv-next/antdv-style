# Performance: createStyles vs createStaticStyles

`createStyles` reads Vue injection, theme state, and props, then recomputes when inputs change. `createStaticStyles` generates classes once at module evaluation time and creates no reactive effects.

<StaticStylesDemo />

<DynamicBenchmarkDemo />

## Optimization order

1. Do not create style factories during render or inside loops.
2. Pass only the smallest style-relevant prop shape.
3. Move fixed large-list structures to `createStaticStyles`.
4. Reuse `createInstance` instead of creating a cache per component.
5. Measure mount, theme switching, and scrolling at realistic scale.

Rules that truly depend on JavaScript appearance state cannot be made static without changing behavior.
