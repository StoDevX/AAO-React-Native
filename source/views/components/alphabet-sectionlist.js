// @flow
import React from 'react'
import {StyleSheet, FlatList, SectionList, Text, View} from 'react-native'
import {SearchBar} from '../components/searchbar'
import * as c from '../components/colors'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  innerListThing: {
    backgroundColor: c.white,
  },
  index: {
    flex: 0,
  },
  innerIndexThing: {
    flex: 0,
    width: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 3,
  },
  indexItem: {},
})

export class SearchableAlphabetSectionList extends React.PureComponent {
  static indicies = 'ABCDEFGHIJKLMNOPQRSTUVXYZ#'.split('')

  searchBar: any = null
  list: any = null

  indexKeyExtractor = (item: string) => item

  indexRenderItem = ({item}: {item: string}) =>
    <IndexItem item={item} onPress={this.scrollToKey} />

  handleSearch = (text: string | Object) => {
    // Android clear button returns an object
    if (typeof text !== 'string') {
      this.setState(state => ({results: state.allTerms}))
      return this.props.onSearch(null)
    }

    return this.props.onSearch(text)
  }

  scrollToKey = (key: string) => {
    const sectionIndex = SearchableAlphabetSectionList.indicies.indexOf(key)
    this.list.scrollToLocation({sectionIndex, itemIndex: 0})
  }

  setSearchBarRef = ref => (this.searchBar = ref)
  setListRef = ref => (this.list = ref)
  unFocusSearchBar = () => this.searchBar.unFocus()

  render() {
    return (
      <View style={styles.container}>
        <SectionList
          ref={this.setListRef}
          ListHeaderComponent={
            <SearchBar
              getRef={this.setSearchBarRef}
              onChangeText={this.handleSearch}
              onSearchButtonPress={this.unFocusSearchBar}
            />
          }
          contentContainerStyle={styles.innerListThing}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="never"
          {...this.props}
        />

        {/*        <FlatList
          data={SearchableAlphabetSectionList.indicies}
          initialNumToRender={SearchableAlphabetSectionList.indicies.length}
          contentContainerStyle={styles.innerIndexThing}
          style={styles.index}
          keyExtractor={this.indexKeyExtractor}
          renderItem={this.indexRenderItem}
          scrollEnabled={false}
        />*/}
      </View>
    )
  }
}

class IndexItem extends React.PureComponent {
  onPress = () => this.props.onPress(this.props.item)

  render() {
    return (
      <Text style={styles.indexItem} onPress={this.onPress}>
        {this.props.item}
      </Text>
    )
  }
}
