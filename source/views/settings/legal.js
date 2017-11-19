// @flow
import * as React from 'react'
import {ScrollView} from 'glamorous-native'
import {Markdown} from '../components/markdown'
import {text} from '../../../docs/legal.json'

type Props = {}

export default class LegalView extends React.PureComponent<Props> {
  static navigationOptions = {
    title: 'Legal',
  }

  render() {
    return (
      <ScrollView paddingHorizontal={15}>
        <Markdown source={text} />
      </ScrollView>
    )
  }
}
