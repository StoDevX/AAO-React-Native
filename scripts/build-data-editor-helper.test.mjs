import assert from 'node:assert/strict'
import {mkdtemp, readFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import vm from 'node:vm'
import {buildHelper} from './build-data-editor-helper.mjs'
import {PROTOCOL} from './data-editor-helper.mjs'

describe('the helper built for JavaScriptCore', () => {
	it('names the commit it was built from and the protocol it speaks', async () => {
		let out = await mkdtemp(path.join(tmpdir(), 'data-editor-helper-'))
		await buildHelper({outDir: out, commit: 'abc123'})
		let published = JSON.parse(await readFile(path.join(out, 'helper.json'), 'utf8'))
		assert.deepEqual(published, {commit: 'abc123', protocol: PROTOCOL})
		// Pages' cache may hold each file at a different deploy, so each names its own commit
		let firstLines = await Promise.all(
			['helper.js', 'bundle-data.js'].map(
				async (script) => (await readFile(path.join(out, script), 'utf8')).split('\n', 1)[0],
			),
		)
		assert.deepEqual(firstLines, ['// data-editor commit abc123', '// data-editor commit abc123'])
	})

	/// JavaScriptCore has no Node: the bundle must load with only what the
	/// Mac app's host gives it, no require and no Node modules, and offer the
	/// helper's handlers.
	it("loads with only what the Mac app's host gives it", async () => {
		let out = await mkdtemp(path.join(tmpdir(), 'data-editor-helper-'))
		await buildHelper({outDir: out, commit: 'abc123'})
		let context = vm.createContext({
			process: {argv: ['node', 'helper.js'], env: {}},
			console,
			setTimeout,
			clearTimeout,
		})
		vm.runInContext(await readFile(path.join(out, 'helper.js'), 'utf8'), context)
		let helper = vm.runInContext('globalThis.dataEditorHelper', context)
		assert.equal(helper.PROTOCOL, PROTOCOL)
		assert.equal(typeof helper.createHandlers, 'function')
	})
})
