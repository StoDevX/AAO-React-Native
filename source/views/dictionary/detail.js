// @flow
import React from 'react'
import {StyleSheet} from 'react-native'
import {Markdown} from '../components/markdown'
import {ListFooter} from '../components/list'
import glamorous from 'glamorous-native'
import type {WordType} from './types'

// TODO: This doesn't point at the SA dictionary because they don't have an
// overview page.
const STO_SA_DICT_URL = 'https://github.com/StoDevX/AAO-React-Native/issues/new'

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

        <ListFooter
          title={
            'Collected by the humans of All About Olaf,\nfrom the Student Activities dictionary'
          }
          href={STO_SA_DICT_URL}
        />
      </Container>
    )
  }
}
