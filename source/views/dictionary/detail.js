// @flow
import React from 'react'
import {StyleSheet} from 'react-native'
import {Markdown} from '../components/markdown'
import glamorous from 'glamorous-native'
import type {WordType} from './types'

const Term = glamorous.text({
  fontSize: 36,
  textAlign: 'center',
  marginHorizontal: 18,
  marginVertical: 10,
})

const Container = glamorous.scrollView({
  paddingHorizontal: 18,
  paddingVertical: 6,
})

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 16,
  },
})

export class DictionaryDetailView extends React.PureComponent {
  static navigationOptions = ({navigation}) => {
    return {
      title: navigation.state.params.item.word,
    }
  }

  props: {
    navigation: {state: {params: {item: WordType}}},
  }

  render() {
    const item = this.props.navigation.state.params.item
    return (
      <Container>
        <Term selectable={true}>{item.word}</Term>
        <Markdown
          styles={{Paragraph: styles.paragraph}}
          source={item.definition}
        />
      </Container>
    )
  }
}
