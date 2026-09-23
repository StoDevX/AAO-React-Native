import type {ReportAttachment} from './submit'

/** The most images one report carries, so a report stays small enough to send. */
export const MAX_ATTACHMENTS = 3

/** An image picked from the photo library, not yet read from disk. */
export type PickedImage = {
	uri: string
	fileName?: string | null
	mimeType?: string
}

/**
 * The name an attachment is filed under in Sentry. The photo library usually
 * supplies one; when it does not, the image is numbered by its place in the
 * report.
 */
export function attachmentFilename(
	image: Pick<PickedImage, 'fileName' | 'mimeType'>,
	index: number,
): string {
	if (image.fileName) {
		return image.fileName
	}

	let extension = image.mimeType?.split('/')[1] ?? 'jpg'
	return `image-${index + 1}.${extension}`
}

/** Reads a picked image's bytes from the file the picker left it in. */
export async function readAttachment(image: PickedImage, index: number): Promise<ReportAttachment> {
	let response = await fetch(image.uri)
	let data = new Uint8Array(await response.arrayBuffer())

	return {
		filename: attachmentFilename(image, index),
		data,
		contentType: image.mimeType,
	}
}
