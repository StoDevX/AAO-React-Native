// @flow
import * as React from 'react'
import delay from 'delay'
import type {StoryType} from './types'
import LoadingView from '../components/loading'
import {NoticeView} from '../components/notice'
import type {TopLevelViewPropsType} from '../types'
import {tracker} from '../../analytics'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import {NewsList} from './news-list'
import {fetchRssFeed, fetchWpJson} from './fetch-feed'

type Props = TopLevelViewPropsType & {
  name: string,
  url: string,
  query?: Object,
  embedFeaturedImage?: boolean,
  mode: 'rss' | 'wp-json',
  thumbnail: number,
}

type State = {
  entries: StoryType[],
  loading: boolean,
  refreshing: boolean,
  error: ?Error,
}
export default class NewsContainer extends React.PureComponent<Props, State> {
  state = {
    entries: [],
    loading: true,
    error: null,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData().then(() => {
      this.setState(() => ({loading: false}))
    })
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

      this.setState(() => ({entries}))
    } catch (error) {
      if (error.message.startsWith('Unexpected token <')) {
        tracker.trackEvent('news', 'St. Olaf WPDefender strikes again')
        this.setState(() => ({
          error: new Error(
            "Oops. Looks like we've triggered a St. Olaf website defense mechanism. Try again in 5 minutes.",
          ),
        }))
      } else {
        reportNetworkProblem(error)
        this.setState(() => ({error}))
      }
    }
  }

  refresh = async (): any => {
    let start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({refreshing: false}))
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
        embedFeaturedImage={this.props.embedFeaturedImage}
        entries={this.state.entries}
        loading={this.state.refreshing}
        mode={this.props.mode}
        name={this.props.name}
        navigation={this.props.navigation}
        onRefresh={this.refresh}
        thumbnail={this.props.thumbnail}
      />
    )
  }
}
