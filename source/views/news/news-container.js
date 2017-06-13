// @flow
import React from 'react'
import delay from 'delay'
import type {StoryType} from './types'
import LoadingView from '../components/loading'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'
import {NewsList} from './news-list'
import {fetchRssFeed, fetchWpJson} from './fetch-feed'

export default class NewsContainer extends React.Component {
  state: {
    entries: StoryType[],
    loading: boolean,
    refreshing: boolean,
    error: ?Error,
  } = {
    entries: [],
    loading: true,
    error: null,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData().then(() => this.setState({loading: false}))
  }

  props: TopLevelViewPropsType & {
    name: string,
    url: string,
    query?: Object,
    embedFeaturedImage?: boolean,
    mode: 'rss' | 'wp-json',
  }

  fetchData = async () => {
    try {
      let entries: StoryType[] = []

      if (this.props.mode === 'rss') {
        entries = await fetchRssFeed(this.props.url, this.props.query)
      } else if (this.props.mode === 'wp-json') {
        entries = await fetchWpJson(this.props.url, this.props.query)
      } else {
        throw new Error(`unknown mode ${this.props.mode}`)
      }

      this.setState({entries})
    } catch (error) {
      if (error.message.startsWith('Unexpected token <')) {
        tracker.trackEvent('news', 'St. Olaf WPDefender strikes again')
        this.setState({
          error: new Error(
            "Oops. Looks like we've triggered a St. Olaf website defense mechanism. Try again in 5 minutes.",
          ),
        })
      } else {
        tracker.trackException(error.message)
        bugsnag.notify(error)
        console.warn(error)
        this.setState({error})
      }
    }
  }

  refresh = async () => {
    let start = Date.now()
    this.setState({refreshing: true})

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState({refreshing: false})
  }

  render() {
    if (this.state.error) {
      return <NoticeView text={`Error: ${this.state.error.message}`} />
    }

    if (this.state.loading) {
      return <LoadingView />
    }

    return (
      <NewsList
        entries={this.state.entries}
        onRefresh={this.refresh}
        loading={this.state.refreshing}
        navigator={this.props.navigator}
        route={this.props.route}
        name={this.props.name}
        mode={this.props.mode}
        embedFeaturedImage={this.props.embedFeaturedImage}
      />
    )
  }
}
