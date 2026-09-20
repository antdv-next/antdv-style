export interface CodemodArguments {
  files: string[]
  unknownOptions: string[]
  write: boolean
  compileLess?: boolean
}

export function parseCodemodArgs(args: string[]): CodemodArguments {
  const files: string[] = []
  const unknownOptions: string[] = []
  let positionalOnly = false
  let write = false
  let compileLess = false

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (!positionalOnly && arg === '--') {
      positionalOnly = true
    } else if (!positionalOnly && arg === '--write') {
      write = true
    } else if (!positionalOnly && arg === '--compile-less') {
      compileLess = true
    } else if (!positionalOnly && (arg === '-i' || arg === '--input')) {
      const input = args[index + 1]
      if (!input || input.startsWith('-')) unknownOptions.push(`${arg} (missing input)`)
      else { files.push(input); index++ }
    } else if (!positionalOnly && arg.startsWith('-')) {
      unknownOptions.push(arg)
    } else {
      files.push(arg)
    }
  }

  return { files, unknownOptions, write, ...(compileLess ? { compileLess } : {}) }
}
