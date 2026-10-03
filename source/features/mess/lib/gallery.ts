import {parseHtml, textContent} from '@frogpond/html-lib'
import {z} from 'zod'
import type {CaptionedPhoto} from '../types'
import {secureUrl} from './blocks'

const SizeSchema = z.object({source_url: z.string(), width: z.number(), height: z.number()})

const GalleryMediaSchema = z.object({
	id: z.number(),
	source_url: z.string(),
	caption: z.object({rendered: z.string()}),
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
		let large = SizeSchema.safeParse(media.media_details.sizes.large)
		if (!large.success || secureUrl(large.data.source_url) === full) {
			let {width, height} = media.media_details
			return [{url: full, width, height, caption}]
		}
		let {width, height} = large.data
		return [{url: secureUrl(large.data.source_url), largeUrl: full, width, height, caption}]
	})
}
