// @flow
import * as React from 'react'
import {ScrollView} from 'glamorous-native'
import {Markdown} from '../components/markdown'
import {text} from '../../../docs/privacy.json'

type Props = {}

export default class PrivacyView extends React.PureComponent<Props> {
  static navigationOptions = {
    title: 'Privacy Policy',
  }

  render() {
    return (
      <ScrollView paddingHorizontal={15}>
        <Markdown source={text} />
      </ScrollView>
    )
  }
}
