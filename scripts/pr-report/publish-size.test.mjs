import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'
import {gzipSync} from 'node:zlib'

import {measurePublish} from './publish-size.mjs'

function site() {
	let dir = mkdtempSync(join(tmpdir(), 'publish-size-'))
	mkdirSync(join(dir, 'img', 'spaces'), {recursive: true})
	mkdirSync(join(dir, 'img', 'contacts'), {recursive: true})
	return dir
}

describe('measurePublish', () => {
	it('sizes data files raw and gzipped, and images by group', () => {
		let dir = site()
		let json = JSON.stringify({data: 'a'.repeat(1000)})
		writeFileSync(join(dir, 'faqs.json'), json)
		writeFileSync(join(dir, 'colors.css'), 'a{}')
		writeFileSync(join(dir, 'notes.txt'), 'not published data')
		writeFileSync(join(dir, 'img', 'spaces', 'a.webp'), 'x'.repeat(100))
		writeFileSync(join(dir, 'img', 'spaces', 'b.webp'), 'x'.repeat(50))
		writeFileSync(join(dir, 'img', 'spaces', 'b.png'), 'x'.repeat(999))
		writeFileSync(join(dir, 'img', 'contacts', 'c.webp'), 'x'.repeat(7))

		let gzip = (text) => gzipSync(text, {level: 9}).length
		assert.deepEqual(measurePublish(dir), {
			dataBytes: json.length + 3,
			dataGzipBytes: gzip(json) + gzip('a{}'),
			imageBytes: 157,
			imageCount: 3,
			byFile: {
				'faqs.json': {bytes: json.length, gzipBytes: gzip(json)},
				'colors.css': {bytes: 3, gzipBytes: gzip('a{}')},
			},
			byImageGroup: {spaces: 150, contacts: 7},
		})
	})

	it('measures a missing directory as empty', () => {
		assert.deepEqual(measurePublish(join(tmpdir(), 'publish-size-no-such-dir')), {
			dataBytes: 0,
			dataGzipBytes: 0,
			imageBytes: 0,
			imageCount: 0,
			byFile: {},
			byImageGroup: {},
		})
	})
})
