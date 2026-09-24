import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as storage from '../../source/lib/storage'

/** Hands `url` to iOS, resolving to whether anything opened it. */
async function genericOpen(url: string): Promise<boolean> {
	try {
		if (!(await Linking.canOpenURL(url))) {
			console.warn('cannot handle', url)
		}
		await Linking.openURL(url)
		return true
	} catch (err) {
		console.error(err)
		return false
	}
}

async function launchBrowser(url: string): Promise<boolean> {
	try {
		await WebBrowser.openBrowserAsync(url, {
			presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
		})
	} catch (error) {
		console.warn(`Error when trying to call launchBrowser: ${error}`)
		return false
	}

	return true
}

export async function openUrl(url: string): Promise<boolean> {
	let protocol = /^(.*?):/u.exec(url)

	if (protocol && protocol.length > 0) {
		switch (protocol[1]) {
			case 'tel':
				return genericOpen(url)
			case 'mailto':
				return genericOpen(url)
			default:
				break
		}
	}

	if (await storage.getInAppLinkPreference()) {
		return launchBrowser(url)
	}

	return genericOpen(url)
}

export function trackedOpenUrl({url}: {url: string; id?: string}): Promise<boolean> {
	return openUrl(url)
}

export function canOpenUrl(url: string): boolean {
	// iOS navigates to about:blank when you provide raw HTML to a webview.
	// Android navigates to data:text/html;$stuff (that is, the document you passed) instead.
	if (/^(?:about|data):/u.test(url)) {
		return false
	}
	return true
}
