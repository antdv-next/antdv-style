import { lstat, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const excluded = new Set(['node_modules', '.git', '.catpaw', 'dist', '.vite', '.output'])

export async function collectVueFiles(input: string): Promise<string[]> {
  const path = resolve(input)
  const info = await lstat(path)
  if (info.isSymbolicLink()) throw new Error('Symbolic-link inputs require explicit manual migration.')
  if (info.isFile()) {
    if (!path.endsWith('.vue')) throw new Error('The Vue adapter accepts .vue files or source directories.')
    return [path]
  }
  if (!info.isDirectory()) throw new Error('Input is not a file or source directory.')
  const entries = await readdir(path, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory() && !excluded.has(entry.name)) {
      files.push(...await collectVueFiles(join(path, entry.name)))
    } else if (entry.isFile() && entry.name.endsWith('.vue')) files.push(join(path, entry.name))
  }
  return files
}
