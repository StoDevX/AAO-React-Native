// @flow
import React from 'react'
import {RefreshControl} from 'react-native'
import {ScrollView} from 'glamorous-native'
import {Markdown} from '../components/markdown'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import {AAO_USER_AGENT} from '../../user-agent'
import LoadingView from '../components/loading'
import * as defaultData from '../../../docs/faqs.json'
import delay from 'delay'

const faqsUrl = 'https://stodevx.github.io/AAO-React-Native/faqs.json'

export class FaqView extends React.PureComponent {
  static navigationOptions = {
    title: 'FAQs',
  }

  state = {
    text: defaultData.text,
    loading: true,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData().then(() => {
      this.setState(() => ({loading: false}))
    })
  }

  fetchData = async () => {
    let {text} = await fetchJson(faqsUrl, {
      headers: new Headers({'User-Agent': AAO_USER_AGENT}),
    }).catch(err => {
      reportNetworkProblem(err)
      return {text: 'There was a problem loading the FAQs'}
    })

    if (process.env.NODE_ENV === 'development') {
      text = defaultData.text
    }

    this.setState(() => ({text}))
  }

  refresh = async () => {
    const start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({refreshing: false}))
  }

  render() {
    if (this.state.loading) {
      return <LoadingView />
    }

    const refreshControl = (
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
      />
    )

    return (
      <ScrollView refreshControl={refreshControl} paddingHorizontal={15}>
        <Markdown source={this.state.text} />
      </ScrollView>
    )
  }
}
