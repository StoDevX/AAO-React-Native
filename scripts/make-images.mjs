#!/usr/bin/env node
/**
 * Build the WebP images the app fetches from ccc-server, which proxies them
 * from GitHub Pages. Each group in `images/` keeps its originals in `source/`;
 * this writes `images/<group>/<name>.webp` beside it. Run after adding or
 * changing an original; the WebP files are committed, and `bundle-data`
 * publishes them under `docs/img/`.
 *
 * Needs ImageMagick (`brew install imagemagick`): `magick`, or `convert` where
 * only version 6 is installed.
 */
import {execFileSync} from 'node:child_process'
import {existsSync, mkdirSync, readdirSync} from 'node:fs'
import {basename, extname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

/**
 * The same list as `IMAGE_GROUPS` in `source/lib/remote-images.ts`, which is
 * the app's side of it; `published-images.test.ts` checks that they match.
 */
export const IMAGE_GROUPS = ['contacts', 'news-sources', 'spaces', 'streaming', 'webcams']

/** Wider than a phone's screen at 3x gains nothing: 1290 is a 430pt-wide iPhone at 3x. */
const MAX_WIDTH = 1290

/** Photographs are lossy at this quality; a PNG source keeps its pixels and its alpha. */
const PHOTO_QUALITY = '68'

const SOURCE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png'])

const hasCommand = (name) => {
	try {
		execFileSync(name, ['-version'], {stdio: 'ignore'})
		return true
	} catch {
		return false
	}
}

/** ImageMagick 7's `magick`, or the version 6 `convert` it replaced. */
const findMagick = () => (hasCommand('magick') ? 'magick' : 'convert')

/** The `images/<group>/source/` originals, as the file names of the WebP each makes. */
export function plannedImages(root = 'images') {
	let planned = []
	for (let group of IMAGE_GROUPS) {
		let sourceDir = join(root, group, 'source')
		if (!existsSync(sourceDir)) {
			continue
		}
		for (let file of readdirSync(sourceDir).toSorted()) {
			let extension = extname(file).toLowerCase()
			if (!SOURCE_EXTENSIONS.has(extension)) {
				continue
			}
			planned.push({
				from: join(sourceDir, file),
				to: join(root, group, `${basename(file, extname(file))}.webp`),
				lossless: extension === '.png',
			})
		}
	}
	return planned
}

function main() {
	let magick = findMagick()
	for (let {from, to, lossless} of plannedImages()) {
		mkdirSync(join(to, '..'), {recursive: true})
		execFileSync(magick, [
			from,
			'-auto-orient',
			'-strip',
			'-resize',
			`${MAX_WIDTH}x>`,
			...(lossless
				? ['-define', 'webp:lossless=true', '-define', 'webp:method=6']
				: ['-quality', PHOTO_QUALITY, '-define', 'webp:method=6']),
			to,
		])
		console.log(to)
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	main()
}
