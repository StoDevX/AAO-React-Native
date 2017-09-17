// @flow
import React from 'react'
import {StyleSheet, FlatList, SectionList, Text, View} from 'react-native'
import * as c from '../components/colors'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    backgroundColor: c.white,
  },
  index: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 3,
  },
  indexItem: {
    // flex: 1,
  },
})

export class AlphabetSectionList extends React.PureComponent {
  static indicies = 'ABCDEFGHIJKLMNOPQRSTUVXYZ#'.split('')

  indexKeyExtractor = (item: string) => item

  indexRenderItem = ({item}: {item: string}) =>
    <Text style={styles.indexItem}>{item}</Text>

  render() {
    return (
      <View style={styles.container}>
        <SectionList contentContainerStyle={styles.list} {...this.props} />
        <FlatList
          data={AlphabetSectionList.indicies}
          initialNumToRender={AlphabetSectionList.indicies.length}
          contentContainerStyle={styles.index}
          keyExtractor={this.indexKeyExtractor}
          renderItem={this.indexRenderItem}
          scrollEnabled={false}
        />
      </View>
    )
  }
}
