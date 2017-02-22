// @flow
import React from 'react'
import {WebView, Platform, Linking, StatusBar} from 'react-native'

import * as c from '../components/colors'

import {tracker} from '../../analytics'
import SafariView from 'react-native-safari-view'
import {CustomTabs} from 'react-native-custom-tabs'

import type {StoryType} from './types'

export default function NewsItem({story, embedFeaturedImage}: {story: StoryType, embedFeaturedImage: ?boolean}) {
  const content = `
    <style>
      body {
        font-family: -apple-system, Roboto, sans-serif;
        font-size: 16px;
        margin: 0;
        padding: 1em;
      }
      div {
        width: auto !important;
      }
      img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 12px auto;
      }
      p {
        line-height: 1.2em;
        margin-bottom: 0.25em;
      }
      iframe {
        max-width: 100%;
      }
      .aao-header {
        border-bottom: solid 2px #eaeaea;
        margin: 0 0 1em;
        padding-bottom: 1em;
        font-weight: bold;
        text-align: center;
      }
      .aao-header h1 {
        line-height: 1.1em;
        font-size: 1.5em;
        margin-bottom: 0;
      }
    </style>
    <header class="aao-header">
      <h1>${story.title}</h1>
    </header>
    ${embedFeaturedImage && story.featuredImage
      ? `<img src="${story.featuredImage}">`
      : ''}
    ${story.content}
  `

  return <HtmlView html={content} />
}

export class HtmlView extends React.Component {
  state = {
    iosOnShowListener: null,
    iosOnDismissListener: null,
  }

  componentWillMount() {
    SafariView.isAvailable()
      .then(() => {
        const iosOnShowListener = SafariView.addEventListener('onShow',
          () => StatusBar.setBarStyle('dark-content'))

        const iosOnDismissListener = SafariView.addEventListener('onDismiss',
          () => StatusBar.setBarStyle('light-content'))

        this.setState({
          iosOnShowListener,
          iosOnDismissListener,
        })
      })
      .catch(() => {})
  }

  componentWillUnmount() {
    SafariView.isAvailable()
      .then(() => {
        SafariView.removeEventListener('onShow', this.state.iosOnShowListener)
        SafariView.removeEventListener('onDismiss', this.state.iosOnDismissListener)
      }).catch(() => {})
  }

  props: {
    html: string,
  }

  _webview: WebView;

  genericOpen(url: string) {
    Linking.canOpenURL(url)
      .then(isSupported => {
        if (!isSupported) {
          console.warn('cannot handle', url)
        }
        return Linking.openURL(url)
      })
      .catch(err => {
        tracker.trackException(err)
        console.error(err)
      })
  }

  iosOpen(url: string) {
    SafariView.isAvailable()
    // if it's around, open in safari
      .then(() => SafariView.show({url}))
      // fall back to opening in default browser
      .catch(() => this.genericOpen(url))
  }

  androidOpen(url: string) {
    try {
      CustomTabs.openURL(url, {
        showPageTitle: true,
        enableUrlBarHiding: true,
        enableDefaultShare: true,
      })
    } catch (err) {
      // fall back to opening in Chrome / Browser / platform default
      this.genericOpen(url)
    }
  }

  onNavigationStateChange = ({url}: {url: string}) => {
    // iOS navigates to about:blank when you provide raw HTML to a webview.
    // Android navigates to data:text/html;$stuff (that is, the document you passed) instead.
    if (/^about|data:/.test(url)) {
      return
    }

    this._webview.stopLoading()
    this._webview.goBack()

    switch (Platform.OS) {
      case 'android':
        return this.androidOpen(url)
      case 'ios':
        return this.iosOpen(url)
      default:
        return this.genericOpen(url)
    }
  }

  render() {
    return (
      <WebView
        ref={ref => this._webview = ref}
        source={{html: this.props.html}}
        onNavigationStateChange={this.onNavigationStateChange}
      />
    )
  }
}
