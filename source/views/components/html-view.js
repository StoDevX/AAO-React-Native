// @flow

import React from 'react'
import {WebView} from 'react-native'
import openUrl, {canOpenUrl} from '../components/open-url'

export class HtmlView extends React.Component {
  props: {
    html: string,
    baseUrl?: ?string,
  }
  _webview: WebView

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

    this._webview.stopLoading()
    this._webview.goBack()

    return openUrl(url)
  }

  render() {
    return (
      <WebView
        ref={ref => (this._webview = ref)}
        source={{html: this.props.html, baseUrl: this.props.baseUrl}}
        onNavigationStateChange={this.onNavigationStateChange}
      />
    )
  }
}
