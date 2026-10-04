import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {bundleImages, missingImages} from './bundle-images.mjs'
import {IMAGE_GROUPS, orphanedImages, plannedImages} from './make-images.mjs'

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-images-'))

describe('bundleImages', () => {
	it("copies each group's WebP files under img/ and leaves the originals behind", () => {
		let from = tempDir()
		let to = tempDir()
		for (let group of IMAGE_GROUPS) {
			fs.mkdirSync(path.join(from, group))
		}
		fs.mkdirSync(path.join(from, 'spaces', 'source'))
		fs.writeFileSync(path.join(from, 'spaces', 'cage.webp'), 'webp')
		fs.writeFileSync(path.join(from, 'spaces', 'source', 'cage.jpg'), 'jpg')

		assert.equal(bundleImages({fromDir: from, toDir: to}), 1)
		assert.deepEqual(fs.readdirSync(path.join(to, 'img', 'spaces')), ['cage.webp'])
	})

	it('refuses to carry on without a group, rather than publish no images', () => {
		let from = tempDir()
		fs.mkdirSync(path.join(from, 'spaces'))

		assert.throws(() => bundleImages({fromDir: from, toDir: tempDir()}), /is missing/u)
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

describe('orphanedImages', () => {
	it('finds a WebP whose original is gone', () => {
		let root = tempDir()
		fs.mkdirSync(path.join(root, 'spaces', 'source'), {recursive: true})
		fs.writeFileSync(path.join(root, 'spaces', 'source', 'cage.jpg'), '')
		fs.writeFileSync(path.join(root, 'spaces', 'cage.webp'), '')
		fs.writeFileSync(path.join(root, 'spaces', 'cage-old.webp'), '')

		assert.deepEqual(orphanedImages(root), [path.join(root, 'spaces', 'cage-old.webp')])
	})
})

describe('the published images', () => {
	const dataDir = fileURLToPath(new URL('../data', import.meta.url))

	it('are all named by an original in source/', () => {
		assert.deepEqual(orphanedImages(), [])
	})

	it('include every one the data names', () => {
		assert.deepEqual(missingImages({dataDir}), [])
	})
})
