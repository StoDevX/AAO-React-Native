import {Linking, Platform} from 'react-native'

import SafariView from 'react-native-safari-view'
import { BrowserResult, InAppBrowser } from 'react-native-inappbrowser-reborn'

function genericOpen(url: string): Promise<boolean> {
	return Linking.canOpenURL(url)
		.then((isSupported) => {
			if (!isSupported) {
				console.warn('cannot handle', url)
			}
			return Linking.openURL(url)
		})
		.catch((err) => {
			console.error(err)
		})
}

function iosOpen(url: string): Promise<boolean> {
	// SafariView.isAvailable throws if it's not available
	return SafariView.isAvailable()
		.then(() => SafariView.show({url}))
		.catch(() => genericOpen(url))
}

function androidOpen(url: string): Promise<BrowserResult|boolean> {
	return InAppBrowser.open(url, {
		showTitle: true,
		enableUrlBarHiding: true,
		enableDefaultShare: true,
	}).catch(() => genericOpen(url)) // fall back to opening in Chrome / Browser / platform default
}

export function openUrl(url: string): Promise<boolean> {
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

	switch (Platform.OS) {
		case 'android':
			return androidOpen(url)
		case 'ios':
			return iosOpen(url)
		default:
			return genericOpen(url)
	}
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
