import type {Block, CaptionedPhoto, MessStory} from '../types'

/**
 * A WordPress upload's address without its scheme, query, Jetpack CDN host or size suffix, so
 * that `http://…/matcha-1024x957.jpg`, the copy WordPress made for a post's body, and
 * `https://i0.wp.com/olafmessenger.com/…/matcha-1024x957.jpg?resize=…` both name the same
 * picture as the featured `https://…/matcha.jpg`.
 */
function pictureKey(url: string): string {
	return url
		.replace(/[?#].*$/u, '')
		.replace(/^https?:\/\/(i\d\.wp\.com\/)?/iu, '')
		.replace(/-\d+x\d+(?=\.[a-z]+$)/iu, '')
}

/**
 * A Photo or Short Story post's pictures: its featured photo first, then each figure in its
 * body, in order, each with its caption; and the body left once the figures are taken out.
 * A copy of the featured photo in the body is drawn once, and lends the featured photo its
 * caption, and its alt text, when that has none.
 */
export function parseFeature(
	photo: MessStory['photo'],
	blocks: Block[],
): {images: CaptionedPhoto[]; blocks: Block[]} {
	let images: CaptionedPhoto[] = photo ? [photo] : []
	let rest: Block[] = []
	for (let block of blocks) {
		if (block.type !== 'figure') {
			rest.push(block)
			continue
		}
		let {url, largeUrl, width, height, caption, alt} = block
		if (photo !== null && pictureKey(url) === pictureKey(photo.url)) {
			let [featured] = images
			if (featured) {
				images[0] = {
					...featured,
					caption: featured.caption || caption,
					...(featured.alt || !alt ? {} : {alt}),
				}
			}
			continue
		}
		// The page draws `url`; the viewer, where a reader zooms, the larger copy.
		images.push({
			url,
			...(largeUrl ? {largeUrl} : {}),
			width,
			height,
			caption,
			...(alt ? {alt} : {}),
		})
	}
	return {images, blocks: rest}
}
