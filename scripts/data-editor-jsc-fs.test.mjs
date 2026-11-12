import assert from 'node:assert/strict'
import * as nodeFs from 'node:fs'
import {mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import * as standIn from './data-editor-jsc/fs.js'

/** What the scripts can read off an error. */
const shape = (call) => {
	try {
		call()
	} catch (error) {
		let {message, code, errno, syscall, path: file} = error
		return {message, code, errno, syscall, path: file}
	}
	assert.fail('expected the call to throw')
}

describe("the JavaScriptCore stand-in for node:fs, against Node's own", () => {
	/// The data editor shows these messages, so a missing file must read as Node says it.
	it('fails on a missing path as Node does', async () => {
		let folder = await mkdtemp(path.join(tmpdir(), 'jsc-fs-'))
		let missing = path.join(folder, 'missing.yaml')
		// the host answers "not there" for any path, as the Swift host does for a missing one
		globalThis.__host = {readFile: () => null, readdir: () => null, stat: () => null}
		try {
			for (let call of ['readFileSync', 'readdirSync', 'statSync', 'lstatSync']) {
				assert.deepEqual(
					shape(() => standIn[call](missing)),
					shape(() => nodeFs[call](missing)),
					call,
				)
			}
		} finally {
			delete globalThis.__host
		}
	})
})
