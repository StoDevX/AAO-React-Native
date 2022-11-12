import * as React from 'react'
import {useCallback, useRef} from 'react'
import {WebView, WebViewNavigation} from 'react-native-webview'
import type {StyleProp, ViewStyle} from 'react-native'
import {canOpenUrl, openUrl} from '@frogpond/open-url'

type Props = {
	html: string
	baseUrl?: string
	style?: StyleProp<ViewStyle>
}

export function HtmlContent(props: Props): JSX.Element {
	let webview = useRef<WebView | null>(null)

	const onNavigationStateChange = useCallback(
		(event: WebViewNavigation) => {
			const {url} = event

			// iOS navigates to about:blank when you provide raw HTML to a webview.
			// Android navigates to data:text/html;$stuff (that is, the document you passed) instead.
			if (!canOpenUrl(url)) {
				return
			}

			// We don't want to open the web browser unless the user actually clicked
			// on a link.
			if (url === props.baseUrl) {
				return
			}

			webview.current?.stopLoading()
			webview.current?.goBack()

			return openUrl(url)
		},
		[props.baseUrl],
	)

	return (
		<WebView
			ref={webview}
			onNavigationStateChange={onNavigationStateChange}
			source={{html: props.html, baseUrl: props.baseUrl}}
			style={props.style}
		/>
	)
}
