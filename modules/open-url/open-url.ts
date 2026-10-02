import {Linking} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as storage from '../../source/lib/storage'

/** Hands `url` to iOS, resolving to whether anything opened it. */
async function genericOpen(url: string): Promise<boolean> {
	try {
		return (await Linking.openURL(url)) !== false
	} catch (err) {
		console.error(err)
		return false
	}
}

/**
 * Whether the device has an app for `url`, such as a phone for `tel:`.
 *
 * iOS answers no for a scheme missing from `LSApplicationQueriesSchemes` in
 * app.config.ts, and React Native turns that answer into a rejection, which
 * this also reads as no.
 */
export async function hasAppFor(url: string): Promise<boolean> {
	try {
		return await Linking.canOpenURL(url)
	} catch {
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

/** A web page's scheme, in any case, as iOS matches schemes. */
const WEB_SCHEME = /^https?:/iu

/**
 * Opens `url` in the in-app browser when it is a web page and the reader's setting asks for that,
 * and otherwise hands it to iOS. The in-app browser refuses any other scheme, and a web scheme not
 * in lowercase, so it gets the scheme lowercased.
 */
export async function openUrl(url: string): Promise<boolean> {
	let webScheme = WEB_SCHEME.exec(url)?.[0]
	if (webScheme && (await storage.getInAppLinkPreference())) {
		return launchBrowser(webScheme.toLowerCase() + url.slice(webScheme.length))
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
