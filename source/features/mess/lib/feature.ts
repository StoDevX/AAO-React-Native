import type {Block, CaptionedPhoto, MessStory} from '../types'

/**
 * A WordPress upload's address without its scheme or its size suffix, so that
 * `http://…/matcha-1024x957.jpg`, the copy WordPress made for a post's body, names the same
 * picture as the featured `https://…/matcha.jpg`.
 */
function pictureKey(url: string): string {
	return url.replace(/^https?:/iu, '').replace(/-\d+x\d+(?=\.[a-z]+$)/iu, '')
}

/**
 * A Photo or Short Story post's pictures: its featured photo first, then each figure in its
 * body, in order, each with its caption; and the body left once the figures are taken out.
 * A copy of the featured photo in the body is drawn once, and lends the featured photo its
 * caption when that has none.
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
		let {url, width, height, caption} = block
		if (photo !== null && pictureKey(url) === pictureKey(photo.url)) {
			let [featured] = images
			if (featured && featured.caption === '') images[0] = {...featured, caption}
			continue
		}
		images.push({url, width, height, caption})
	}
	return {images, blocks: rest}
}
