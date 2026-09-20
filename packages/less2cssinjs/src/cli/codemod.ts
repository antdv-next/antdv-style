#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { migrateVueSfcLess } from '../index'
import { parseCodemodArgs } from './arguments'
import { collectVueFiles } from './files'

const usage = 'Usage: antdv-style-codemod [--write] [--compile-less] [-i <directory>] <files-or-directories...>'
const { files, unknownOptions, write, compileLess } = parseCodemodArgs(process.argv.slice(2))

if (unknownOptions.length > 0) {
  for (const option of unknownOptions) console.error(`Unknown option: ${option}`)
  console.error(usage)
  process.exitCode = 1
} else if (files.length === 0) {
  console.error(usage)
  process.exitCode = 1
} else {
  let hasErrors = false
  const inputs = new Set<string>()
  const explicit = new Set(files.filter(file => file.endsWith('.vue')).map(file => resolve(file)))
  for (const input of files) {
    try {
      for (const file of await collectVueFiles(input)) inputs.add(file)
    } catch (error) {
      hasErrors = true
      console.error(`${input}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  for (const file of inputs) {
    const path = resolve(file)
    try {
      const source = await readFile(path, 'utf8')
      if (!explicit.has(path)) {
        const { descriptor, errors } = parse(source, { filename: path })
        if (!errors.length && !descriptor.styles.some(style => style.lang === 'less' && style.module)) continue
      }
      const result = await migrateVueSfcLess(source, path, { compileLess })
      if (result.diagnostics.length > 0) {
        hasErrors = true
        for (const item of result.diagnostics) {
          const position = item.line ? `:${item.line}${item.column ? `:${item.column}` : ''}` : ''
          console.error(`${file}${position} ${item.message}`)
        }
        continue
      }
      if (!result.changed) continue
      if (write) await writeFile(path, result.code, 'utf8')
      console.log(`${write ? 'updated' : 'would update'} ${file}`)
    } catch (error) {
      hasErrors = true
      console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  if (hasErrors) process.exitCode = 2
}
