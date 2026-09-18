import { describe, expect, it } from 'vitest'

import { parseCodemodArgs } from '../cli/arguments'
import { collectVueFiles } from '../cli/files'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('codemod CLI arguments', () => {
  it('accepts --write and positional files', () => {
    expect(parseCodemodArgs(['--write', 'Card.vue'])).toEqual({
      files: ['Card.vue'],
      unknownOptions: [],
      write: true,
    })
  })

  it('rejects unknown options instead of silently ignoring them', () => {
    expect(parseCodemodArgs(['--wrtie', 'Card.vue'])).toEqual({
      files: ['Card.vue'],
      unknownOptions: ['--wrtie'],
      write: false,
    })
  })

  it('treats arguments after -- as file names', () => {
    expect(parseCodemodArgs(['--', '--example.vue'])).toEqual({
      files: ['--example.vue'],
      unknownOptions: [],
      write: false,
    })
  })

  it('accepts upstream-style directory input flags and refuses missing values', () => {
    expect(parseCodemodArgs(['-i', 'src', '--write']).files).toEqual(['src'])
    expect(parseCodemodArgs(['--input', 'src']).files).toEqual(['src'])
    expect(parseCodemodArgs(['-i', '--write']).unknownOptions).toEqual(['-i (missing input)'])
  })

  it('walks Vue sources without entering dependencies or build output', async () => {
    const root = await mkdtemp(join(tmpdir(), 'antdv-migration-files-'))
    for (const name of ['src', 'node_modules', 'dist']) {
      await mkdir(join(root, name))
      await writeFile(join(root, name, 'Card.vue'), '<template><div /></template>')
    }
    await writeFile(join(root, 'src', 'style.less'), '.root {}')
    expect(await collectVueFiles(root)).toEqual([join(root, 'src', 'Card.vue')])
    await expect(collectVueFiles(join(root, 'src', 'style.less'))).rejects.toThrow('.vue')
  })
})
