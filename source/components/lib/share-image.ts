import {Platform, Share} from 'react-native'
import {File, Paths} from 'expo-file-system'
import {shareAsync} from 'expo-sharing'

/**
 * Opens the share sheet with the picture at `uri` itself, so it offers Save Image and Print
 * as well as the places to send it. A web image is downloaded to the cache first, because
 * the share sheet treats a web address as a link; the download keeps the server's file name,
 * whose extension tells the sheet it is an image.
 *
 * Android's share sheet takes a file only through a content URI, which React Native's
 * `Share` cannot make (it shares text alone there), so Android shares the file through
 * expo-sharing.
 */
export async function shareImage(uri: string): Promise<void> {
	let url = uri
	if (/^https?:/u.test(uri)) {
		let file = await File.downloadFileAsync(uri, Paths.cache, {idempotent: true})
		url = file.uri
	}
	if (Platform.OS === 'android') {
		await shareAsync(url, {mimeType: 'image/*'})
		return
	}
	await Share.share({url})
}
