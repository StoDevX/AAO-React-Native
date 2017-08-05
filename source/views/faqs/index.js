// @flow
import React from 'react'
import {ScrollView} from 'glamorous-native'
import {Markdown} from '../components/markdown'
import LoadingView from '../components/loading'
import {text} from '../../../docs/faqs.json'
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'

const faqsUrl = 'https://stodevx.github.io/AAO-React-Native/faqs.json'

export class FaqView extends React.PureComponent {
  static navigationOptions = {
    title: 'FAQs',
  }

  state = {
    text: text,
  }

  componentWillMount() {
    this.fetchData()
  }

  fetchData = async () => {
    let fetched = text
    try {
      let blob: {text: string} = await fetchJson(faqsUrl)
      fetched = blob.text
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      console.warn(err.message)
    }

    if (process.env.NODE_ENV === 'development') {
      fetched = text
    }

    this.setState({text: fetched})
  }

  render() {
    if (!this.state.text) {
      return <LoadingView />
    }

    return (
      <ScrollView paddingHorizontal={15}>
        <Markdown source={text} />
      </ScrollView>
    )
  }
}
