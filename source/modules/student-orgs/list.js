// @flow
/**
 * All About Olaf
 * StudentOrgs page
 */

import React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import {StyledAlphabetListView} from '../../components/alphabet-listview'
import debounce from 'lodash/debounce'
import type {TopLevelViewPropsType} from '../types'
import LoadingView from '../../components/loading'
import delay from 'delay'
import {NoticeView} from '../../components/notice'
import {Row, Column} from '../../components/layout'
import {
  ListRow,
  ListSectionHeader,
  ListSeparator,
  Detail,
  Title,
} from '../../components/list'
import {tracker} from '../../init/analytics'
import bugsnag from '../../init/bugsnag'
import size from 'lodash/size'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import filter from 'lodash/filter'
import isString from 'lodash/isString'
import * as c from '../../components/colors'
import startCase from 'lodash/startCase'
import {SearchBar} from '../../components/searchbar'
import type {StudentOrgType} from './types'

const orgsUrl =
  'https://www.stolaf.edu/orgs/list/index.cfm?fuseaction=getall&nostructure=1'
const leftSideSpacing = 20
const rowHeight = Platform.OS === 'ios' ? 58 : 74
const headerHeight = Platform.OS === 'ios' ? 33 : 41

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  row: {
    height: rowHeight,
    paddingRight: 2,
  },
  rowSectionHeader: {
    height: headerHeight,
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    width: leftSideSpacing,
  },
  badge: {
    fontSize: Platform.OS === 'ios' ? 24 : 28,
    color: c.transparent,
  },
})

export class StudentOrgsView extends React.Component {
  static navigationOptions = {
    title: 'Student Orgs',
    headerBackTitle: 'Orgs',
  }

  props: TopLevelViewPropsType
  searchBar: any

  state: {
    orgs: {[key: string]: StudentOrgType[]},
    results: {[key: string]: StudentOrgType[]},
    refreshing: boolean,
    error: boolean,
    loaded: boolean,
  } = {
    orgs: {},
    results: {},
    refreshing: false,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.refresh()
  }

  fetchData = async () => {
    try {
      const responseData: StudentOrgType[] = await fetchJson(orgsUrl)
      const sortableRegex = /^(St\.? Olaf(?: College)?|The) +/i
      const withSortableNames = responseData.map(item => {
        const sortableName = item.name.replace(sortableRegex, '')

        return {
          ...item,
          $sortableName: sortableName,
          $groupableName: head(startCase(sortableName)),
        }
      })

      const sorted = sortBy(withSortableNames, '$sortableName')
      const grouped = groupBy(sorted, '$groupableName')
      this.setState({orgs: sorted, results: grouped})
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      this.setState({error: true})
      console.error(err)
    }

    this.setState({loaded: true})
  }

  refresh = async () => {
    const start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({refreshing: false}))
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
        <Row alignItems="flex-start">
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>•</Text>
          </View>

          <Column flex={1}>
            <Title lines={1}>{item.name}</Title>
            <Detail lines={1}>{item.category}</Detail>
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
    tracker.trackEvent('student-org', data.name)
    this.props.navigation.navigate('StudentOrgsDetailView', {org: data})
  }

  splitToArray = (str: string) => {
    return words(deburr(str.toLowerCase()))
  }

  orgToArray = (term: StudentOrgType) => {
    return uniq([
      ...this.splitToArray(term.name),
      ...this.splitToArray(term.category),
      ...this.splitToArray(term.description),
    ])
  }

  _performSearch = (text: string) => {
    // Android clear button returns an object...
    // ...and we need to check if the query exists
    if (!isString(text) || !text) {
      this.setState({
        results: groupBy(this.state.orgs, '$groupableName'),
      })
      return
    }

    const query = text.toLowerCase()
    const filteredResults = filter(this.state.orgs, org =>
      this.orgToArray(org).some(word => word.startsWith(query)),
    )

    this.setState({results: groupBy(filteredResults, '$groupableName')})
  }

  // We need to make the search run slightly behind the UI,
  // so I'm slowing it down by 50ms. 0ms also works, but seems
  // rather pointless.
  performSearch = debounce(this._performSearch, 50)

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (!size(this.state.orgs)) {
      return <NoticeView text="No organizations found." />
    }

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
