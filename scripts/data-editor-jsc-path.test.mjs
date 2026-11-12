import assert from 'node:assert/strict'
import path from 'node:path'
import {describe, it} from 'node:test'
import * as standIn from './data-editor-jsc/path.js'

describe("the JavaScriptCore stand-in for node:path, against Node's own", () => {
	it('resolves relative paths against the working directory', () => {
		globalThis.__host = {cwd: () => process.cwd()}
		try {
			for (let parts of [
				['data', 'building-hours'],
				['data/building-hours', '../x.yaml'],
				['/root', 'data', '../x'],
				['data', '/abs', 'x'],
				['.'],
				[],
			]) {
				assert.equal(standIn.resolve(...parts), path.resolve(...parts), parts.join(', '))
			}
		} finally {
			delete globalThis.__host
		}
	})
})
