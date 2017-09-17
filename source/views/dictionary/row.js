// @flow

import React from 'react'
import {StyleSheet} from 'react-native'
import {Column} from '../components/layout'
import {Detail, Title, ListRow} from '../components/list'
import type {WordType} from './types'

const styles = StyleSheet.create({
  rowDetailText: {
    fontSize: 14,
  },
})

type Props = {
  entry: WordType,
  onPress: WordType => any,
}

export class DictionaryRow extends React.PureComponent<void, Props, void> {
  onPress = () => {
    this.props.onPress(this.props.entry)
  }

  render() {
    return (
      <ListRow onPress={this.onPress} arrowPosition="none">
        <Column>
          <Title lines={1}>{this.props.entry.word}</Title>
          <Detail lines={2} style={styles.rowDetailText}>
            {this.props.entry.definition}
          </Detail>
        </Column>
      </ListRow>
    )
  }
}
