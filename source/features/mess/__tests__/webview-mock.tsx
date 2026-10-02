import * as React from 'react'
import {View} from 'react-native'

import type {WebViewProps} from 'react-native-webview'

/** A view that keeps every prop it is given, so a test can call the handlers passed to the web view. */
const HostView = View as unknown as React.ComponentType<Record<string, unknown>>

/// react-native-webview draws a native WKWebView, which Jest does not have, so the Mess's
/// tests draw a plain view labelled with the address it was asked to load. What the page
/// shows is Spotify's; the UITests and a look on the simulator cover it.
export function WebView(props: WebViewProps): React.ReactNode {
	let {source} = props
	let uri = source !== undefined && 'uri' in source ? source.uri : undefined
	return <HostView {...props} accessibilityLabel={uri} />
}
