import {parseHtml, textContent} from '@frogpond/html-lib'
import {z} from 'zod'
import type {Block, CaptionedPhoto} from '../types'
import {readableAlt} from './alt'
import {secureUrl} from './blocks'

const SizeSchema = z.object({source_url: z.string(), width: z.number(), height: z.number()})

const GalleryMediaSchema = z.object({
	id: z.number(),
	source_url: z.string(),
	caption: z.object({rendered: z.string()}),
	alt_text: z.string().optional(),
	media_details: z.object({
		width: z.number(),
		height: z.number(),
		sizes: z.record(z.string(), z.unknown()),
	}),
})

/** A media record's rendered caption as the words it shows. */
function captionText(html: string): string {
	return textContent(parseHtml(html)).replaceAll(/\s+/gu, ' ').trim()
}

/**
 * A gallery's photos, from `media?include=…`, in the order of `photoIds`, which is the
 * slideshow's: WordPress answers newest first. Each is drawn at the copy WordPress made
 * for a large screen, with the full file kept for the zoom viewer. A photo the response
 * lacks, or carries in a shape this cannot read, is left out.
 */
export function parseGalleryPhotos(body: unknown, photoIds: number[]): CaptionedPhoto[] {
	let items = z.array(z.unknown()).safeParse(body)
	if (!items.success) return []
	let byId = new Map(
		items.data.flatMap((raw) => {
			let media = GalleryMediaSchema.safeParse(raw)
			return media.success ? [[media.data.id, media.data] as const] : []
		}),
	)
	return photoIds.flatMap((id): CaptionedPhoto[] => {
		let media = byId.get(id)
		if (!media) return []
		let full = secureUrl(media.source_url)
		let caption = captionText(media.caption.rendered)
		let alt = readableAlt(media.alt_text)
		let words = alt ? {caption, alt} : {caption}
		let large = SizeSchema.safeParse(media.media_details.sizes.large)
		if (!large.success || secureUrl(large.data.source_url) === full) {
			let {width, height} = media.media_details
			return [{url: full, width, height, ...words}]
		}
		let {width, height} = large.data
		return [{url: secureUrl(large.data.source_url), largeUrl: full, width, height, ...words}]
	})
}

/** The photos a gallery shows: those fetched, or until they load, the one its HTML carries. */
export function shownPhotos(
	gallery: Extract<Block, {type: 'gallery'}>,
	fetched: CaptionedPhoto[] | undefined,
): CaptionedPhoto[] {
	if (fetched?.length) return fetched
	return gallery.cover ? [{...gallery.cover, caption: ''}] : []
}

type Size = {width: number; height: number}

/** How much taller than wide a gallery's page may be, so a tall photo leaves the page room. */
const TALLEST_PAGE = 1.5

/**
 * The height of a gallery's pages: its tallest photo at the column's width, so no page grows
 * the gallery as it turns, up to one and a half times the width.
 */
export function galleryPageHeight(photos: Size[], columnWidth: number): number {
	let tallest = Math.max(...photos.map((photo) => (columnWidth * photo.height) / photo.width))
	return Math.round(Math.min(tallest, columnWidth * TALLEST_PAGE))
}

/** A photo's size on a gallery's page: the column's width, or narrower to fit the page's height. */
export function photoFit(photo: Size, columnWidth: number, pageHeight: number): Size {
	let height = (columnWidth * photo.height) / photo.width
	if (height <= pageHeight) return {width: columnWidth, height: Math.round(height)}
	return {width: Math.round((pageHeight * photo.width) / photo.height), height: pageHeight}
}
