import {Image} from 'react-native'
import {getApiRoot} from '@frogpond/api'
import {DEFAULT_URL} from './constants'

/**
 * The folders ccc-server serves images from, one per kind of picture. They
 * are the folders of `images/` in this repo, which `bundle-data` publishes to
 * GitHub Pages and ccc-server proxies at `/v1/images/<group>/<name>.webp`.
 */
export type ImageGroup = 'contacts' | 'news-sources' | 'spaces' | 'streaming' | 'webcams'

/**
 * Where an image is fetched from.
 *
 * Read when the image is drawn, not when a module loads: the server address is
 * a setting read from storage after launch, and until it arrives the default
 * server is the one to ask.
 */
export function imageUrl(group: ImageGroup, name: string): string {
	let root = getApiRoot() ?? new URL(DEFAULT_URL)
	return new URL(`images/${group}/${name}.webp`, root).toString()
}

/** An image for an `<Image source>`, fetched over the network. */
export function remoteImage(group: ImageGroup, name: string): {uri: string} {
	return {uri: imageUrl(group, name)}
}

/**
 * Starts fetching images into the cache so they are there when drawn. A
 * failure is ignored: the image is fetched again when it is drawn, and fails
 * visibly there if the network is still out.
 */
export function prefetchImages(urls: readonly string[]): void {
	for (let url of urls) {
		Image.prefetch(url).catch(() => undefined)
	}
}
