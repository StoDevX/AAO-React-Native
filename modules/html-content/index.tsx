import * as React from 'react'
import {WebView} from 'react-native-webview'
import {openUrl, canOpenUrl} from '@frogpond/open-url'
import type {StyleProp, ViewStyle} from 'react-native'

type Props = {
	html: string
	baseUrl?: string
	style?: StyleProp<ViewStyle>
}

export class HtmlContent extends React.Component<Props> {
	_webview: WebView | null = null

	onNavigationStateChange = ({url}: {url: string}) => {
		// iOS navigates to about:blank when you provide raw HTML to a webview.
		// Android navigates to data:text/html;$stuff (that is, the document you passed) instead.
		if (!canOpenUrl(url)) {
			return
		}

		// We don't want to open the web browser unless the user actually clicked
		// on a link.
		if (url === this.props.baseUrl) {
			return
		}

		this._webview?.stopLoading()
		this._webview?.goBack()

		return openUrl(url)
	}

	render() {
		return (
			<WebView
				ref={(ref) => (this._webview = ref)}
				onNavigationStateChange={this.onNavigationStateChange}
				source={{html: this.props.html, baseUrl: this.props.baseUrl}}
				style={this.props.style}
			/>
		)
	}
}
