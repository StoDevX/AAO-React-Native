/**
 * Measure the data and images published to Pages for the pull request report.
 *
 * The app downloads these at runtime, so they are not part of the installed
 * app. Pages serves them gzipped, so that is the figure a device pays for.
 */

import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs'
import {join} from 'node:path'
import {gzipSync} from 'node:zlib'

/** Where the images live under the published site; see `PUBLISHED_DIR` in bundle-images.mjs. */
const IMAGES_DIR = 'img'

/** The data files the app fetches: the bundled JSON, and the one stylesheet. */
const DATA_FILE = /\.(?:json|css)$/u

/**
 * Measures a bundled `docs/` directory. Data files are the top-level
 * `.json` and `.css` files, sized raw and gzipped; images are the `.webp`
 * files under `img/<group>/`, summed per group. A directory that does not
 * exist measures as empty rather than throwing, so the caller decides what
 * an empty site means.
 */
export function measurePublish(dir) {
	let byFile = {}
	let byImageGroup = {}
	let imageCount = 0
	if (existsSync(dir)) {
		for (let entry of readdirSync(dir, {withFileTypes: true})) {
			if (entry.isFile() && DATA_FILE.test(entry.name)) {
				let contents = readFileSync(join(dir, entry.name))
				byFile[entry.name] = {
					bytes: contents.length,
					gzipBytes: gzipSync(contents, {level: 9}).length,
				}
			}
		}
		let imagesDir = join(dir, IMAGES_DIR)
		if (existsSync(imagesDir)) {
			for (let group of readdirSync(imagesDir, {withFileTypes: true})) {
				if (!group.isDirectory()) {
					continue
				}
				let bytes = 0
				for (let name of readdirSync(join(imagesDir, group.name))) {
					if (name.endsWith('.webp')) {
						bytes += statSync(join(imagesDir, group.name, name)).size
						imageCount += 1
					}
				}
				byImageGroup[group.name] = bytes
			}
		}
	}
	let sum = (pick) => Object.values(byFile).reduce((total, file) => total + file[pick], 0)
	return {
		dataBytes: sum('bytes'),
		dataGzipBytes: sum('gzipBytes'),
		imageBytes: Object.values(byImageGroup).reduce((total, bytes) => total + bytes, 0),
		imageCount,
		byFile,
		byImageGroup,
	}
}
