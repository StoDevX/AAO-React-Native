import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {readdirSync} from 'node:fs'
import {cp, mkdtemp, readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {createInterface} from 'node:readline'
import {describe, it} from 'node:test'
import {buildHelper} from './build-data-editor-helper.mjs'
import {DATA_BASE, REPO_ROOT} from './paths.mjs'

describe('the bundled helper', () => {
	it('builds the data from a workspace that has no repo around it', async (t) => {
		let ws = await mkdtemp(path.join(tmpdir(), 'data-editor-ws-'))
		await buildHelper({outDir: path.join(ws, 'scripts')})
		await cp(DATA_BASE, path.join(ws, 'data'), {recursive: true})
		// what the app downloads: the image groups and their published WebP files,
		// not the originals under each group's source/
		await cp(path.join(REPO_ROOT, 'images'), path.join(ws, 'images'), {
			recursive: true,
			filter: (from) => !from.split(path.sep).includes('source'),
		})
		let published = readdirSync(path.join(ws, 'images/spaces')).filter((f) => f.endsWith('.webp'))
		let child = spawn(process.execPath, [
			path.join(ws, 'scripts/data-editor-helper.mjs'),
			'--data',
			path.join(ws, 'data'),
			'--out',
			path.join(ws, 'out'),
		])
		// a failed assertion must not leave the helper waiting on stdin
		t.after(() => child.kill())
		let lines = createInterface({input: child.stdout})[Symbol.asyncIterator]()
		child.stdin.write('{"id":1,"method":"build"}\n')
		let reply = JSON.parse((await lines.next()).value)
		assert.deepEqual(reply, {id: 1, result: {ok: true}})
		// the build must not convert or remove the workspace's images
		assert.deepEqual(
			readdirSync(path.join(ws, 'images/spaces')).filter((f) => f.endsWith('.webp')),
			published,
		)
		// an edit runs the formatter, whose native binding ships beside the bundle
		let url = `https://example.com/${'a'.repeat(100)}`
		child.stdin.write(
			`${JSON.stringify({id: 2, method: 'edit', params: {file: 'building-hours/1-1-cage.yaml', ops: [{path: ['links', 0, 'url'], value: url}]}})}\n`,
		)
		let edited = JSON.parse((await lines.next()).value)
		child.stdin.end()
		assert.deepEqual(edited.result?.problems, [], JSON.stringify(edited))
		let written = await readFile(path.join(ws, 'data/building-hours/1-1-cage.yaml'), 'utf8')
		assert.match(written, new RegExp(`\\n {6}url: '${url}',\\n {4}\\}`, 'u'))
		let stamp = JSON.parse(await readFile(path.join(ws, 'scripts/helper-stamp.json'), 'utf8'))
		assert.match(stamp.scriptsTree, /^[0-9a-f]{40}$/u)
		assert.match(stamp.modulesTree, /^[0-9a-f]{40}$/u)
	})
})
