// Development runner: the API server (restarted when backend/ or shared/ .ts files
// change) and the Vite dev server, with prefixed output.
// Usage: npm run dev
import { spawn } from 'node:child_process'
import { existsSync, watch } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const envArgs = existsSync(path.join(root, '.env')) ? ['--env-file=.env'] : []

const prefix = (name, color) => `\x1b[${color}m[${name}]\x1b[0m `
function run(name, color, args) {
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, FORCE_COLOR: '1' } })
  const tag = prefix(name, color)
  const pipe = (stream, out) => stream.on('data', (chunk) => out.write(chunk.toString().replace(/^(?=.)/gm, tag)))
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  return child
}

let stopping = false
let api = run('api', 35, [...envArgs, 'backend/src/server.ts'])
const web = run('web', 36, [path.join(root, 'node_modules/vite/bin/vite.js')])

// Restart the API when its source changes (debounced; waits for the old process to exit).
let timer
const restart = () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    process.stdout.write(`${prefix('api', 35)}change detected, restarting…\n`)
    const old = api
    old.once('exit', () => {
      if (!stopping) api = run('api', 35, [...envArgs, 'backend/src/server.ts'])
    })
    old.kill()
  }, 200)
}
for (const dir of ['backend', 'shared']) {
  watch(path.join(root, dir), { recursive: true }, (_event, file) => {
    if (file && file.endsWith('.ts') && !file.includes('tests')) restart()
  })
}

web.on('exit', (code) => shutdown(code ?? 0))

function shutdown(code) {
  if (stopping) return
  stopping = true
  api.kill()
  web.kill()
  process.exit(code)
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
