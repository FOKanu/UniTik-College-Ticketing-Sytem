import { describe, expect, it } from 'vitest'
import { ticketsApi } from './tickets'
// @ts-ignore
import * as fs from 'fs'
// @ts-ignore
import * as path from 'path'

declare const process: { cwd: () => string; platform: string }

function collectTextFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectTextFiles(filePath, extensions))
    } else if (extensions.includes(path.extname(entry.name))) {
      files.push(filePath)
    }
  }
  return files
}

describe('ticketsApi contract', () => {
  it('exposes list, listMine, and getById methods', () => {
    expect(typeof ticketsApi.list).toBe('function')
    expect(typeof ticketsApi.listMine).toBe('function')
    expect(typeof ticketsApi.getById).toBe('function')
  })
})

describe('frontend merge conflict markers', () => {
  it('does not contain unresolved merge markers in source files', () => {
    const root = process.cwd()
    const sep = process.platform === 'win32' ? '\\' : '/'
    const files = collectTextFiles(root, [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.css',
      '.html',
      '.json',
      '.md',
    ]).filter(
      (file) => !file.includes(`${root}${sep}node_modules`) && !file.includes(`${root}${sep}frontend${sep}.venv`),
    )
    const conflicts: string[] = []

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split(/\r?\n/)
      const hasMarker = lines.some(
        (line: string) =>
          line.startsWith('<<<<<<< ') ||
          line === '=======' ||
          line.startsWith('>>>>>>> '),
      )
      if (hasMarker) {
        conflicts.push(file.replace(`${root}${sep}`, ''))
      }
    }

    expect(conflicts).toEqual([])
  })
})


