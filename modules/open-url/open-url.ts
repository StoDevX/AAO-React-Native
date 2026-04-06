import {Linking} from 'react-native'
import {InAppBrowser} from 'react-native-inappbrowser-reborn'
import * as storage from '../../src/lib/storage'

async function genericOpen(url: string): Promise<boolean> {
	try {
		const isSupported = await Linking.canOpenURL(url)
		if (!isSupported) {
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
		if (await InAppBrowser.isAvailable()) {
			await InAppBrowser.open(url, {
				animated: true,
				showTitle: true,
				enableUrlBarHiding: true,
				enableDefaultShare: true,
				modalPresentationStyle: 'currentContext',
			})
		} else {
			// fall back to opening in Chrome / Browser / platform default
			await genericOpen(url)
		}
	} catch (error) {
		console.warn(`Error when trying to call launchBrowser: ${error}`)
		return false
	}

	return true
}

export async function openUrl(url: string): Promise<boolean> {
	let protocol = /^(.*?):/u.exec(url)

	if (protocol && protocol.length) {
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

export function trackedOpenUrl({
	url,
}: {
	url: string
	id?: string
}): Promise<boolean> {
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
