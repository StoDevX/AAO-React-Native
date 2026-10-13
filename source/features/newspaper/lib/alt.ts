import type {CaptionedPhoto} from '../types'

/** A name ending in an image extension, as a camera or an upload names a file. */
const FILE_NAME = /\.(?:jpe?g|png|gif|webp|heic|avif|bmp|tiff?)$/iu

/** A camera's or screenshot's own name for a picture: `IMG 7781`, `Screenshot 2024-05-01 at …`. */
const CAMERA_NAME = /^(?:IMG|DSCN?|PXL|Screen ?shot)[\s_-]*\d/iu

/**
 * A picture's alt text when it reads as words, else null. The paper leaves alt text empty
 * or fills it with a file name (`IMG_7781`, `OliviaAmschler_1`), which says nothing to
 * someone looking at the picture, so a lone token, which no sentence is, is dropped too.
 */
export function readableAlt(alt: string | undefined): string | null {
	let text = (alt ?? '').replaceAll(/\s+/gu, ' ').trim()
	if (!text.includes(' ')) return null
	if (FILE_NAME.test(text) || CAMERA_NAME.test(text)) return null
	return text
}

/** The words to show with a picture: its caption, else its readable alt text, else nothing. */
export function shownCaption(photo: Pick<CaptionedPhoto, 'caption' | 'alt'>): string {
	return photo.caption || photo.alt || ''
}
