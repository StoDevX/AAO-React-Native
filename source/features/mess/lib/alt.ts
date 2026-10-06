/** A name ending in an image extension, as a camera or an upload names a file. */
const FILE_NAME = /\.(?:jpe?g|png|gif|webp|heic|avif|bmp|tiff?)$/iu

/**
 * A picture's alt text when it reads as words, else null. The paper leaves alt text empty
 * or fills it with a file name (`IMG_7781`, `OliviaAmschler_1`), which says nothing to
 * someone looking at the picture, so a lone token, which no sentence is, is dropped too.
 */
export function readableAlt(alt: string | undefined): string | null {
	let text = (alt ?? '').replaceAll(/\s+/gu, ' ').trim()
	if (!text.includes(' ') || FILE_NAME.test(text)) return null
	return text
}
