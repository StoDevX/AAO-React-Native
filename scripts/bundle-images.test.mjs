import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {bundleImages, missingImages} from './bundle-images.mjs'
import {plannedImages} from './make-images.mjs'

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-images-'))

describe('bundleImages', () => {
	it("copies each group's WebP files under img/ and leaves the originals behind", () => {
		let from = tempDir()
		let to = tempDir()
		fs.mkdirSync(path.join(from, 'spaces', 'source'), {recursive: true})
		fs.writeFileSync(path.join(from, 'spaces', 'cage.webp'), 'webp')
		fs.writeFileSync(path.join(from, 'spaces', 'source', 'cage.jpg'), 'jpg')

		assert.equal(bundleImages({fromDir: from, toDir: to}), 1)
		assert.deepEqual(fs.readdirSync(path.join(to, 'img', 'spaces')), ['cage.webp'])
	})
})

describe('plannedImages', () => {
	it('names a WebP beside each original, lossless only for a PNG', () => {
		let root = tempDir()
		fs.mkdirSync(path.join(root, 'streaming', 'source'), {recursive: true})
		fs.writeFileSync(path.join(root, 'streaming', 'source', 'ksto.png'), '')
		fs.writeFileSync(path.join(root, 'streaming', 'source', 'wordmark.jpg'), '')
		fs.writeFileSync(path.join(root, 'streaming', 'source', 'notes.txt'), '')

		assert.deepEqual(
			plannedImages(root).map(({to, lossless}) => [path.relative(root, to), lossless]),
			[
				['streaming/ksto.webp', true],
				['streaming/wordmark.webp', false],
			],
		)
	})
})

describe('the published data', () => {
	it('names no image that has no WebP', () => {
		assert.deepEqual(missingImages({dataDir: 'data', imagesDir: 'images'}), [])
	})
})
