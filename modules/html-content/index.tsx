import * as React from 'react'
import {useCallback, useImperativeHandle, useRef} from 'react'
import {WebView, WebViewNavigation} from 'react-native-webview'
import type {StyleProp, ViewStyle} from 'react-native'
import {canOpenUrl, openUrl} from '@frogpond/open-url'

/** What a screen can ask of the page it shows. */
export type HtmlContentHandle = {
	/** Opens the system find bar over the page, as Safari's Find on Page does. iOS only. */
	findInPage: () => void
}

type Props = {
	html: string
	baseUrl?: string
	style?: StyleProp<ViewStyle>
	ref?: React.Ref<HtmlContentHandle>
}

export function HtmlContent({html, baseUrl, style, ref}: Props): React.ReactNode {
	let webview = useRef<WebView | null>(null)

	useImperativeHandle(ref, () => ({
		findInPage: () => webview.current?.presentFindNavigator(),
	}))

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
			if (url === baseUrl) {
				return
			}

			webview.current?.stopLoading()
			webview.current?.goBack()

			return openUrl(url)
		},
		[baseUrl],
	)

	return (
		<WebView
			ref={webview}
			onNavigationStateChange={onNavigationStateChange}
			source={{html, baseUrl}}
			style={style}
		/>
	)
}
