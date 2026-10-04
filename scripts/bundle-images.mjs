import fs from 'node:fs'
import path from 'node:path'
import {load as loadYaml} from 'js-yaml'
import {IMAGE_GROUPS, IMAGES_DIR} from './make-images.mjs'

/**
 * Where the published images live under the Pages site: `img/<group>/<name>.webp`.
 * ccc-server proxies this tree at `/v1/images/<group>/<name>.webp`.
 */
export const PUBLISHED_DIR = 'img'

/**
 * Copy each group's committed WebP files into `<toDir>/img/<group>/`. A group
 * with no folder is an error: carrying on would publish a site with no images,
 * and every device would then 404 every picture.
 */
export function bundleImages({fromDir = IMAGES_DIR, toDir}) {
	let copied = 0
	for (let group of IMAGE_GROUPS) {
		let groupDir = path.join(fromDir, group)
		if (!fs.existsSync(groupDir)) {
			throw new Error(
				`bundle-images: ${groupDir} is missing, so the "${group}" images cannot be published`,
			)
		}
		let outDir = path.join(toDir, PUBLISHED_DIR, group)
		fs.mkdirSync(outDir, {recursive: true})
		for (let file of fs.readdirSync(groupDir).filter((name) => name.endsWith('.webp'))) {
			fs.copyFileSync(path.join(groupDir, file), path.join(outDir, file))
			copied += 1
		}
	}
	return copied
}

/** The `<field>` of every yaml file in `dir`, with the file it came from. */
function slugsIn(dir, field) {
	if (!fs.existsSync(dir)) {
		return []
	}
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith('.yaml'))
		.flatMap((name) => {
			let entry = loadYaml(fs.readFileSync(path.join(dir, name), 'utf-8'))
			let slug = entry?.[field]
			return typeof slug === 'string' ? [{file: path.join(dir, name), slug}] : []
		})
}

/**
 * Every image the data names -- a building's `image`, a contact's `image`, a
 * webcam's `thumbnail` -- that has no WebP to fetch. A missing one shows the
 * app a blank picture rather than an error, so the build catches it instead.
 */
export function missingImages({dataDir, imagesDir = IMAGES_DIR}) {
	let references = [
		...slugsIn(path.join(dataDir, 'building-hours'), 'image').map((r) => ({...r, group: 'spaces'})),
		...slugsIn(path.join(dataDir, 'contact-info'), 'image').map((r) => ({
			...r,
			group: 'contacts',
		})),
		...slugsIn(path.join(dataDir, 'webcams'), 'thumbnail').map((r) => ({...r, group: 'webcams'})),
	]
	return references
		.filter(({group, slug}) => !fs.existsSync(path.join(imagesDir, group, `${slug}.webp`)))
		.map(({file, group, slug}) => `${file}: no images/${group}/${slug}.webp`)
}
