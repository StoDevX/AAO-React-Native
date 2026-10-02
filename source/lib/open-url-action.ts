/** The native event an `openURLAction` modifier sends when a link is tapped. */
type OpenURLEvent = {url: string}

/**
 * Sends a tapped link in the text below this view to `handler` instead of
 * straight to Safari, as SwiftUI's `.environment(\.openURL, OpenURLAction {…})`
 * does. Native via a patch to `@expo/ui` (`patches/@expo__ui@57.0.14.patch`).
 */
export function openURLAction(handler: (url: string) => void): {
	$type: 'openURLAction'
	eventListener: (event: OpenURLEvent) => void
} {
	return {$type: 'openURLAction', eventListener: ({url}) => handler(url)}
}
