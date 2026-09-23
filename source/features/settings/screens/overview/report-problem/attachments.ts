import * as Sentry from '@sentry/react-native'
import type {PickedImage} from '../../../../../components/use-image-attachments'
import type {ReportAttachment} from './submit'

/**
 * Reads a picked image's bytes for sending. Sentry reads the file natively,
 * where a `fetch` of the file URI would leave the path behind as a breadcrumb.
 * Every picked image has been re-encoded as JPEG, so each is numbered by its
 * place in the report rather than named for its original.
 */
export async function readAttachment(image: PickedImage, index: number): Promise<ReportAttachment> {
	let data = await Sentry.getDataFromUri(image.uri)
	if (!data) {
		throw new Error(`could not read ${image.uri}`)
	}

	return {filename: `image-${index + 1}.jpg`, data, contentType: 'image/jpeg'}
}
