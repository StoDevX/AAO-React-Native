// @flow

import React from 'react'
import {StyleSheet, Platform} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
import debounce from 'lodash/debounce'
import {SearchBar} from '../components/searchbar'

export const LIST_HEADER_HEIGHT = Platform.OS === 'ios' ? 42 : 0

type Props = any
;[]

export class SearchableAlphabetListView extends React.PureComponent<
  void,
  Props,
  void,
> {
  searchBar: any = null

  _performSearch = (text: string | Object) => {
    // Android clear button returns an object
    if (typeof text !== 'string') {
      return this.props.onSearch(null)
    }

    return this.props.onSearch(text)
  }

  // We need to make the search run slightly behind the UI,
  // so I'm slowing it down by 50ms. 0ms also works, but seems
  // rather pointless.
  performSearch = debounce(this._performSearch, 50)

  renderListHeader = () =>
    <SearchBar
      getRef={ref => (this.searchBar = ref)}
      onChangeText={this.performSearch}
      // if we don't use the arrow function here, searchBar ref is null...
      onSearchButtonPress={() => this.searchBar.unFocus()}
    />

  render() {
    return (
      <StyledAlphabetListView
        header={this.renderListHeader}
        headerHeight={
          Platform.OS === 'ios'
            ? LIST_HEADER_HEIGHT + StyleSheet.hairlineWidth * 12
            : 0
        }
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="never"
        {...this.props}
      />
    )
  }
}
