// @flow
/**
 * All About Olaf
 * Directory page
 */

import React from 'react'
import {StyleSheet, View, Text, Image, Platform} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
import debounce from 'lodash/debounce'
import type {TopLevelViewPropsType} from '../types'
import LoadingView from '../components/loading'
import delay from 'delay'
import {NoticeView} from '../components/notice'
import {Row, Column} from '../components/layout'
import {
  ListRow,
  ListSectionHeader,
  ListSeparator,
  Detail,
  Title,
} from '../components/list'
import qs from 'querystring'
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'
import size from 'lodash/size'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import filter from 'lodash/filter'
import isString from 'lodash/isString'
import * as c from '../components/colors'
import startCase from 'lodash/startCase'
import {SearchBar} from '../components/searchbar'
import type {StudentOrgType} from './types'

const url = 'https://www.stolaf.edu/directory/index.cfm'

const leftSideSpacing = 20
const rowHeight = Platform.OS === 'ios' ? 58 : 74
const headerHeight = Platform.OS === 'ios' ? 33 : 41

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  row: {
    height: rowHeight,
    marginLeft: 22,
  },
  rowSectionHeader: {
    height: headerHeight,
  },
  image: {
    width: 45,
    marginRight: 10,
  },
})

export class DirectoryView extends React.Component {
  static navigationOptions = {
    title: 'Directory',
    headerBackTitle: 'Home',
  }

  state: {
    results: {[key: string]: StudentOrgType[]},
    refreshing: boolean,
    error: boolean,
    loaded: boolean,
  } = {
    results: {},
    refreshing: false,
    loaded: false,
    error: false,
  }

  props: TopLevelViewPropsType

  fetchData = async (query: string) => {
    try {
      let params = {
        fuseaction: 'SearchResults',
        format: 'json',
        query: query,
      }

      const responseData: StudentOrgType[] = await fetchJson(
        `${url}?${qs.stringify(params)}`,
      )
      const results = responseData.results

      const sortableRegex = /^(St\.? Olaf(?: College)?|The) +/i
      const withSortableNames = results.map(item => {
        const sortableName = item.lastName.replace(sortableRegex, '')

        return {
          ...item,
          $sortableName: sortableName,
          $groupableName: head(startCase(sortableName)),
        }
      })

      const sorted = sortBy(withSortableNames, '$sortableName')
      const grouped = groupBy(sorted, '$groupableName')
      this.setState({results: grouped})
    } catch (err) {
      // tracker.trackException(err.message)
      // bugsnag.notify(err)
      this.setState({error: true})
      console.error(err)
    }

    this.setState({loaded: true})
  }

  renderSectionHeader = ({title}: {title: string}) => {
    return (
      <ListSectionHeader
        title={title}
        spacing={{left: leftSideSpacing}}
        style={styles.rowSectionHeader}
      />
    )
  }

  renderRow = ({item}: {item: StudentOrgType}) => {
    return (
      <ListRow
        onPress={() => this.onPressRow(item)}
        contentContainerStyle={[styles.row]}
        arrowPosition="none"
        fullWidth={true}
      >
        <Row>
          <Image source={{uri: item.thumbnail}} style={styles.image} />
          <Column flex={1}>
            <Title lines={1}>
              {item.firstName.trim()} {item.lastName.trim()}
            </Title>
            <Detail lines={1}>{item.title}</Detail>
          </Column>
        </Row>
      </ListRow>
    )
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return (
      <ListSeparator
        key={`${sectionId}-${rowId}`}
        spacing={{left: leftSideSpacing}}
      />
    )
  }

  onPressRow = (data: StudentOrgType) => {
    // tracker.trackEvent('student-org', data.name)
    this.props.navigation.navigate('DirectoryDetailView', {org: data})
  }

  splitToArray = (str: string) => {
    return words(deburr(str.toLowerCase()))
  }

  // add department name from array
  orgToArray = (word: StudentOrgType) => {
    return uniq([
      ...this.splitToArray(word.firstName),
      ...this.splitToArray(word.lastName),
      ...this.splitToArray(word.email),
      ...this.splitToArray(word.title),
      ...this.splitToArray(word.officePhone),
      ...this.splitToArray(word.extension),
      ...this.splitToArray(word.classYear),
      ...this.splitToArray(word.building),
    ])
  }

  _performSearch = async (text: string) => {
    // Android clear button returns an object...
    // ...and we need to check if the query exists
    if (!isString(text) || !text) {
      this.setState({
        results: groupBy(this.state.results, '$groupableName'),
      })
      return
    }

    const query = text.toLowerCase()
    await this.fetchData(query)

    const filteredResults = filter(this.state.results, org =>
      this.orgToArray(org).some(word => word.startsWith(query)),
    )

    this.setState({results: groupBy(filteredResults, '$groupableName')})
  }

  // We need to make the search run slightly behind the UI,
  // so I'm slowing it down by 50ms. 0ms also works, but seems
  // rather pointless.
  performSearch = debounce(this._performSearch, 250)

  searchBar: any

  render() {
    // if (!size(this.state.results)) {
    //   return <NoticeView text="No Results" />
    // }

    return (
      <View style={styles.wrapper}>
        <SearchBar
          getRef={ref => (this.searchBar = ref)}
          onChangeText={this.performSearch}
          // if we don't use the arrow function here, searchBar ref is null...
          onSearchButtonPress={() => this.searchBar.unFocus()}
        />
        <StyledAlphabetListView
          data={this.state.results}
          cell={this.renderRow}
          // just setting cellHeight sends the wrong values on iOS.
          cellHeight={
            rowHeight +
            (Platform.OS === 'ios' ? 11 / 12 * StyleSheet.hairlineWidth : 0)
          }
          sectionHeader={this.renderSectionHeader}
          sectionHeaderHeight={headerHeight}
          renderSeparator={this.renderSeparator}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="never"
        />
      </View>
    )
  }
}
