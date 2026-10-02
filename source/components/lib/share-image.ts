import {Share} from 'react-native'
import {File, Paths} from 'expo-file-system'

/**
 * Opens the share sheet with the picture at `uri` itself, so it offers Save Image and Print
 * as well as the places to send it. A web image is downloaded to the cache first, because
 * the share sheet treats a web address as a link; the download keeps the server's file name,
 * whose extension tells the sheet it is an image.
 */
export async function shareImage(uri: string): Promise<void> {
	let url = uri
	if (/^https?:/u.test(uri)) {
		let file = await File.downloadFileAsync(uri, Paths.cache, {idempotent: true})
		url = file.uri
	}
	await Share.share({url})
}
