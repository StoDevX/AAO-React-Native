import {File, Paths} from 'expo-file-system'
import {shareAsync} from 'expo-sharing'

/**
 * Android's `shareImage`: opens the share sheet with the picture at `uri`
 * itself. A web image is downloaded to the cache first, as on iOS.
 *
 * Android's share sheet takes a file only through a content URI, which React
 * Native's `Share` cannot make (it shares text alone there), so the file goes
 * through expo-sharing. It lives in this file so that iOS, which links no
 * expo-sharing (`expo.autolinking.ios.exclude`), never loads it.
 */
export async function shareImage(uri: string): Promise<void> {
	let url = uri
	if (/^https?:/u.test(uri)) {
		let file = await File.downloadFileAsync(uri, Paths.cache, {idempotent: true})
		url = file.uri
	}
	await shareAsync(url, {mimeType: 'image/*'})
}
