import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const root = fileURLToPath(new URL('../', import.meta.url))
const pnpm = process.env.npm_execpath
assert.ok(pnpm && existsSync(pnpm), 'Run this check with pnpm test:packages')
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const temporary = mkdtempSync(join(tmpdir(), 'antdv-style-packed-'))
const version = manifest.version
const store = run(root, process.execPath, [pnpm, 'store', 'path', '--silent']).trim()
const lock = YAML.parse(readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8'))
const antdvNextVersion = lock.importers['.'].devDependencies['antdv-next'].version.split('(')[0]
const overrides = {}
// Keep isolated fixtures on the repository's locked dependency graph.
for (const [parent, snapshot] of Object.entries(lock.snapshots)) {
  for (const [name, reference] of Object.entries({
    ...snapshot.dependencies, ...snapshot.optionalDependencies,
  })) {
    if (lock.packages[parent.split('(')[0]]?.peerDependencies?.[name]) continue
    const version = reference.split('(')[0]
    if (/^\d/.test(version)) overrides[`${parent.split('(')[0]}>${name}`] = version
  }
}
for (const directory of ['.', 'packages/vite-plugin-antdv-style', 'packages/less2cssinjs']) {
  const pkg = JSON.parse(readFileSync(join(root, directory, 'package.json'), 'utf8'))
  for (const [name, resolution] of Object.entries(lock.importers[directory].dependencies)) {
    overrides[`${pkg.name}>${name}`] = resolution.version.split('(')[0]
  }
}

function run(directory, executable, args) {
  const result = spawnSync(executable, args, {
    cwd: directory,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, CI: 'true' },
  })
  if (result.status !== 0) {
    throw new Error(`${executable} ${args.join(' ')}\n${result.stdout}\n${result.stderr}\n${result.error ?? ''}`)
  }
  return result.stdout
}

function runExpectedFailure(directory, executable, args) {
  const result = spawnSync(executable, args, {
    cwd: directory,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 180_000,
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, CI: 'true' },
  })
  assert.notEqual(result.status, 0, `${executable} ${args.join(' ')} unexpectedly succeeded`)
  return result
}

function fixture(name, packageName, archiveName, devDependencies = {}) {
  const directory = join(temporary, name)
  mkdirSync(directory)
  const archive = join(root, 'artifacts', `${archiveName}-${version}.tgz`)
  assert.ok(existsSync(archive), 'Run pnpm pack:packages before pnpm test:packages')
  writeFileSync(join(directory, 'package.json'), JSON.stringify({
    name: `packed-${name}`,
    private: true,
    type: 'module',
    dependencies: { [packageName]: `file:${archive.replaceAll('\\', '/')}` },
    devDependencies: { typescript: '5.9.3', ...devDependencies },
    pnpm: { overrides },
  }, null, 2))
  writeFileSync(join(directory, '.npmrc'), 'auto-install-peers=false\nhoist=false\nshamefully-hoist=false\n')
  console.log(run(directory, process.execPath, [
    pnpm, 'install', '--prefer-offline', '--ignore-scripts', '--store-dir', store,
    '--hoist=false', '--shamefully-hoist=false', '--public-hoist-pattern=!**',
  ]))
  const modules = YAML.parse(readFileSync(join(directory, 'node_modules', '.modules.yaml'), 'utf8'))
  assert.deepEqual(modules.hoistedDependencies ?? {}, {}, 'Fixture dependencies must not be hoisted')
  return directory
}

function checkTypes(directory, source) {
  writeFileSync(join(directory, 'check.ts'), source)
  run(directory, process.execPath, [
    pnpm, 'exec', 'tsc', '--noEmit', '--target', 'ES2020', '--module', 'ESNext',
    '--moduleResolution', 'Bundler', '--skipLibCheck', 'check.ts',
  ])
}

function checkModule(directory, source) {
  writeFileSync(join(directory, 'verify.mjs'), source)
  console.log(run(directory, process.execPath, ['verify.mjs']))
}

console.log(`Isolated package fixtures: ${temporary}`)

const plugin = fixture('plugin', 'vite-plugin-antdv-style', 'vite-plugin-antdv-style')
checkTypes(plugin, `import plugin, { transformStyleLabels, type StyleLabelPluginOptions } from 'vite-plugin-antdv-style'
const options: StyleLabelPluginOptions = { include: /src/ }
plugin(options)
transformStyleLabels('', 'src/a.ts', options)
`)
checkModule(plugin, `import assert from 'node:assert/strict'
import plugin, { transformStyleLabels } from 'vite-plugin-antdv-style'
assert.equal(plugin().name, 'vite-plugin-antdv-style')
const result = transformStyleLabels("import { createStyles } from 'antdv-style'; const useStyles = createStyles(() => ({}))", '/src/card.ts')
assert.match(result.code, /label: "useStyles"/)
const dev = plugin()
dev.configResolved({ root: '/project', command: 'serve', isProduction: false })
assert.match(dev.transform("import { createStyles } from 'antdv-style'; const useStyles = createStyles(() => ({}))", '/project/src/Card.ts').code, /Card-useStyles/)
dev.configResolved({ root: '/project', command: 'build', isProduction: true })
assert.equal(dev.transform("import { createStyles } from 'antdv-style'; const useStyles = createStyles(() => ({}))", '/project/src/Card.ts'), null)
await assert.rejects(import('@antdv-next/less2cssinjs'))
console.log('Packed plugin: import, transform, types and independent dependencies passed')
`)

const codemod = fixture('codemod', '@antdv-next/less2cssinjs', 'antdv-next-less2cssinjs')
checkTypes(codemod, `import { migrateVueSfcLess, compileVueSfcLess, transformVueSfcLess, transformLessToCreateStyles, type VueLessCodemodResult } from '@antdv-next/less2cssinjs'
const result: VueLessCodemodResult = transformVueSfcLess('')
transformLessToCreateStyles('.root { color: red; }')
const compiled: Promise<VueLessCodemodResult> = compileVueSfcLess('')
const upstream: Promise<VueLessCodemodResult> = migrateVueSfcLess('', 'Card.vue', { tokenMap: { brand: 'colorPrimary' } })
`)
checkModule(codemod, `import assert from 'node:assert/strict'
import { transformVueSfcLess, compileVueSfcLess, migrateVueSfcLess } from '@antdv-next/less2cssinjs'
const source = '<template><div :class="$style.root" /></template><style module lang="less">.root { color: red; }</style>'
const result = transformVueSfcLess(source)
assert.equal(result.changed, true)
assert.deepEqual(result.diagnostics, [])
assert.match(result.code, /from 'antdv-style'/)
const compiled = await compileVueSfcLess(source.replace('color: red;', 'padding: (8px * 2);'))
assert.equal(compiled.changed, true)
assert.match(compiled.code, /16px/)
const unsafe = source.replace('color: red;', 'background: data-uri("never-read");')
assert.equal((await compileVueSfcLess(unsafe)).code, unsafe)
const upstream = await migrateVueSfcLess(source.replace('color: red;', 'color: @primary-color; .textOverflow(); :global(.ant-btn) { color: red; }'))
assert.deepEqual(upstream.diagnostics, [])
assert.match(upstream.code, /token.colorPrimary/)
assert.match(upstream.code, /text-overflow: ellipsis/)
await assert.rejects(import('antdv-style'))
console.log('Packed codemod: import, transform, types and no runtime dependency passed')
`)
const sfc = '<template><div :class="$style.root" /></template><style module lang="less">.root { color: red; }</style>'
for (const [name, template] of [
  ['External', '<template src="./External.html"></template>'],
  ['Pug', '<template lang="pug">div(:class="$style.root") Hello</template>'],
]) {
  const filename = `${name}.vue`
  const source = `${template}\n<style module lang="less">.root { color: red; }</style>`
  writeFileSync(join(codemod, filename), source)
  for (const flags of [[], ['--write']]) {
    const refused = runExpectedFailure(codemod, process.execPath, [
      pnpm, 'exec', 'antdv-style-codemod', ...flags, filename,
    ])
    assert.equal(refused.status, 2)
    assert.match(refused.stderr, /templates require manual CSS Module migration/)
    assert.equal(readFileSync(join(codemod, filename), 'utf8'), source)
  }
}
console.log('Packed codemod: external and preprocessed template refusal preserves files, including --write')
for (const [index, attribute] of ['module', 'module=""', 'module="$style"'].entries()) {
  const filename = `MixedModules${index}.vue`
  const source = `${sfc}<style ${attribute}>.root { color: blue; }</style>`
  writeFileSync(join(codemod, filename), source)
  for (const flags of [[], ['--write'], ['--compile-less', '--write']]) {
    const refused = runExpectedFailure(codemod, process.execPath, [
      pnpm, 'exec', 'antdv-style-codemod', ...flags, filename,
    ])
    assert.equal(refused.status, 2)
    assert.match(refused.stderr, /Mixed Less and non-Less default CSS Modules/)
    assert.equal(readFileSync(join(codemod, filename), 'utf8'), source)
  }
}
console.log('Packed codemod: mixed default module refusal preserves files in dry-run/write/compile modes')
writeFileSync(join(codemod, 'Card.vue'), sfc)
const invalid = runExpectedFailure(codemod, process.execPath, [
  pnpm, 'exec', 'antdv-style-codemod', '--wrtie', 'Card.vue',
])
assert.equal(invalid.status, 1)
assert.match(invalid.stderr, /Unknown option: --wrtie/)
assert.equal(readFileSync(join(codemod, 'Card.vue'), 'utf8'), sfc)
const dry = run(codemod, process.execPath, [pnpm, 'exec', 'antdv-style-codemod', 'Card.vue'])
assert.match(dry, /would update/)
assert.equal(readFileSync(join(codemod, 'Card.vue'), 'utf8'), sfc)
run(codemod, process.execPath, [pnpm, 'exec', 'antdv-style-codemod', '--write', 'Card.vue'])
assert.match(readFileSync(join(codemod, 'Card.vue'), 'utf8'), /from 'antdv-style'/)
const complex = sfc.replace('.root { color: red; }', '@space: 8px; .pad() { padding: (@space * 2); } .root { .pad(); }')
writeFileSync(join(codemod, 'Compiled.vue'), complex)
const compileDry = run(codemod, process.execPath, [pnpm, 'exec', 'antdv-style-codemod', '--compile-less', 'Compiled.vue'])
assert.match(compileDry, /would update/)
assert.equal(readFileSync(join(codemod, 'Compiled.vue'), 'utf8'), complex)
run(codemod, process.execPath, [pnpm, 'exec', 'antdv-style-codemod', '--compile-less', '--write', 'Compiled.vue'])
assert.match(readFileSync(join(codemod, 'Compiled.vue'), 'utf8'), /16px/)
const blocked = sfc.replace('.root { color: red; }', '@import "missing.less"; .root { color: red; }')
writeFileSync(join(codemod, 'Blocked.vue'), blocked)
const refusal = runExpectedFailure(codemod, process.execPath, [pnpm, 'exec', 'antdv-style-codemod', '--compile-less', '--write', 'Blocked.vue'])
assert.equal(refusal.status, 2)
assert.equal(readFileSync(join(codemod, 'Blocked.vue'), 'utf8'), blocked)

const batch = join(codemod, 'batch')
mkdirSync(batch)
mkdirSync(join(batch, 'nested'))
mkdirSync(join(batch, 'node_modules'))
writeFileSync(join(batch, 'Plain.vue'), '<template><div /></template>')
writeFileSync(join(batch, 'nested', 'Nested.vue'), sfc.replace('color: red;', '.textOverflow(); :global(.ant-btn) { color: blue; }'))
writeFileSync(join(batch, 'node_modules', 'Ignored.vue'), sfc)
const batchDry = run(codemod, process.execPath, [pnpm, 'exec', 'antdv-style-codemod', '-i', 'batch'])
assert.match(batchDry, /would update/)
assert.match(readFileSync(join(batch, 'nested', 'Nested.vue'), 'utf8'), /style module/)
run(codemod, process.execPath, [pnpm, 'exec', 'antdv-style-codemod', '--write', '--input', 'batch'])
assert.match(readFileSync(join(batch, 'nested', 'Nested.vue'), 'utf8'), /text-overflow: ellipsis/)
assert.equal(readFileSync(join(batch, 'node_modules', 'Ignored.vue'), 'utf8'), sfc)
const missing = runExpectedFailure(codemod, process.execPath, [pnpm, 'exec', 'antdv-style-codemod', 'not-found.vue'])
assert.equal(missing.status, 2)
console.log('Packed codemod: upstream reuse, recursive directory dry-run/write and missing-file handling passed')

const runtime = fixture('runtime', 'antdv-style', 'antdv-style', {
  'antdv-next': antdvNextVersion,
  vue: '3.5.31',
  vite: '8.0.3',
  '@types/node': '25.5.0',
})
checkTypes(runtime, `import { createStyles, createInstance, px2remTransformer, type StyleProviderProps } from 'antdv-style'
const useStyles = createStyles(({ token }) => ({ root: { color: token.colorPrimary } }))
const instance = createInstance()
const transformers: StyleProviderProps['transformers'] = [px2remTransformer({ mediaQuery: true })]
`)
writeFileSync(join(runtime, 'entry.ts'), `import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createInstance, extractStaticStyle, px2remTransformer } from 'antdv-style'
import { version as antdvNextVersion } from 'antdv-next'
export async function verify() {
  const instance = createInstance({ key: 'packed' })
  const useStyles = instance.createStyles({ root: { color: 'plum' } })
  const App = defineComponent({ setup() {
    const state = useStyles()
    return () => h('div', { class: state.styles.root }, 'packed')
  } })
  try {
    const html = await renderToString(createSSRApp({
      render: () => h(instance.ThemeProvider, null, { default: () => h(App) }),
    }))
    return {
      antdvNextVersion,
      html,
      css: extractStaticStyle(instance.styleManager, { html }).css,
      converted: px2remTransformer()('background:url("/icon-16px.png");content:"16px";padding:16px'),
      visited: px2remTransformer({ mediaQuery: true }).visit({ padding: 32, lineHeight: 2, '@media (min-width: 640px)': {} }),
    }
  } finally { instance.dispose() }
}
`)
checkModule(runtime, `import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { readFileSync } from 'node:fs'
const pkg = JSON.parse(readFileSync(new URL(import.meta.resolve('antdv-style/package.json')), 'utf8'))
assert.deepEqual(Object.keys(pkg.exports).sort(), ['.', './package.json'])
assert.equal(pkg.bin, undefined)
for (const name of ['vite-plugin-antdv-style', '@antdv-next/less2cssinjs', 'postcss-less', 'less', '@babel/traverse']) {
  assert.equal(pkg.dependencies[name], undefined)
  await assert.rejects(import(name))
}
const server = await createServer({
  configFile: false, server: { middlewareMode: true, hmr: false }, logLevel: 'error',
  ssr: { noExternal: ['antdv-style', 'antdv-next', /^@v-c\\//, '@antdv-next/cssinjs'] },
})
try {
  const { verify } = await server.ssrLoadModule('/entry.ts')
  const result = await verify()
  assert.equal(result.antdvNextVersion, ${JSON.stringify(antdvNextVersion)})
  assert.match(result.html, /packed-/)
  assert.match(result.css, /color:plum/)
  assert.equal(result.converted, 'background:url("/icon-16px.png");content:"16px";padding:1rem')
  assert.deepEqual(result.visited, { padding: '2rem', lineHeight: 2, '@media (min-width: 40rem)': {} })
} finally { await server.close() }
console.log('Packed runtime: antdv-next ${antdvNextVersion}, types, real SSR and no tooling dependencies passed')
`)

console.log(`Package archives PASS. Retained fixtures: ${temporary}`)
