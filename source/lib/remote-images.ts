import {Image} from 'react-native'
import {apiUrl} from './api-url'
import {PLATFORM_SERVER} from '../campuses'

/**
 * The folders ccc-server serves images from, one per kind of picture. They
 * are the folders of `images/` in this repo, which `bundle-data` publishes to
 * GitHub Pages and ccc-server proxies at `/v1/images/<group>/<name>.webp`.
 *
 * `images/groups.json`, which the publishing scripts read, and ccc-server's
 * `IMAGE_GROUPS` in `source/ccc-lib/images.ts` are the same list; a group
 * missing from either is never published or never served. This one is spelt
 * out so that `ImageGroup` can be a union; `published-images.test.ts` checks
 * it against the JSON.
 */
export const IMAGE_GROUPS = ['contacts', 'news-sources', 'spaces', 'streaming', 'webcams'] as const

export type ImageGroup = (typeof IMAGE_GROUPS)[number]

/** An image fetched over the network, for an `<Image source>`. */
export type RemoteImage = {uri: string; cache: 'force-cache'}

/**
 * Where an image is fetched from.
 *
 * Read when the image is drawn, not when a module loads: the server address is
 * a setting read from storage after launch, and until it arrives the default
 * server is the one to ask.
 */
export function imageUrl(group: ImageGroup, name: string): string {
	// The platform server publishes every campus's images (images/groups.json).
	return apiUrl(PLATFORM_SERVER, `images/${group}/${name}.webp`)
}

/**
 * An image for an `<Image source>`, fetched over the network.
 *
 * A device keeps what it fetched and shows it with no network, rather than
 * asking again once it is stale, so a picture that changes is published under
 * a new name.
 */
export function remoteImage(group: ImageGroup, name: string): RemoteImage {
	return {uri: imageUrl(group, name), cache: 'force-cache'}
}

/**
 * Starts fetching images into the cache so they are there when drawn. A
 * failure is ignored: the image is fetched again when it is drawn, and fails
 * visibly there if the network is still out. The promise settles once every
 * fetch has, and never rejects, for a caller that wants to wait.
 */
export async function prefetchImages(urls: readonly string[]): Promise<void> {
	await Promise.all([...new Set(urls)].map((url) => Image.prefetch(url).catch(() => false)))
}
