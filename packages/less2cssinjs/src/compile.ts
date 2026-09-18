import less from 'less'

class NoExternalFiles extends less.FileManager {
  override supports() { return true }
  override supportsSync() { return true }
  override loadFile(): Promise<Less.FileLoadResult> {
    return Promise.reject(new Error('External files are disabled during migration.'))
  }
  override loadFileSync(): Less.FileLoadResult {
    throw new Error('External files are disabled during migration.')
  }
}

export async function compileLessSource(source: string, filename: string): Promise<string> {
  if (/@(?:import|plugin)\b|`|\b(?:data-uri|image-size|image-width|image-height)\s*\(/i.test(source)) {
    throw new Error('Imports, plugins, JavaScript and file-reading Less functions require manual migration.')
  }
  const result = await less.render(source, {
    filename,
    javascriptEnabled: false,
    disablePluginRule: true,
    plugins: [{
      install(_less, manager) { manager.addFileManager(new NoExternalFiles()) },
    }],
  } as Less.Options & { disablePluginRule: boolean })
  return result.css
}
