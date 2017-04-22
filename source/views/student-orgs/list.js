// @flow
/**
 * All About Olaf
 * StudentOrgs page
 */

import React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
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
import {tracker} from '../../analytics'
import size from 'lodash/size'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import * as c from '../components/colors'
import startCase from 'lodash/startCase'
import {Searchbar} from '../components/searchbar'
import type {StudentOrgAbridgedType} from './types'

const orgsUrl = 'https://api.presence.io/stolaf/v1/organizations'
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
  newOrgBadge: {
    color: c.infoBlue,
  },
})

export class StudentOrgsView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    route: React.PropTypes.object.isRequired,
  }

  state: {
    data: {[key: string]: StudentOrgAbridgedType[]},
    pureData: {[key: string]: StudentOrgAbridgedType[]},
    refreshing: boolean,
    error: boolean,
    searching: boolean,
    loaded: boolean,
  } = {
    data: {},
    pureData: {},
    refreshing: false,
    searching: false,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.refresh()
  }

  fetchData = async () => {
    try {
      let responseData: {
        [key: string]: StudentOrgAbridgedType[],
      } = await fetchJson(orgsUrl)
      this.setState({data: responseData, pureData: responseData})
    } catch (error) {
      tracker.trackException(error.message)
      this.setState({error: true})
      console.error(error)
    }

    this.setState({loaded: true})
  }

  refresh = async () => {
    let start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
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

  getSectionListTitle = (name: string) => {
    return name === 'New' ? '•' : name
  }

  renderRow = ({item}: {item: StudentOrgAbridgedType}) => {
    return (
      <ListRow
        onPress={() => this.onPressRow(item)}
        contentContainerStyle={[styles.row]}
        arrowPosition="none"
        fullWidth={true}
      >
        <Row alignItems="flex-start">
          <View style={styles.badgeContainer}>
            <Text style={[styles.badge, item.newOrg && styles.newOrgBadge]}>
              •
            </Text>
          </View>

          <Column flex={1}>
            <Title lines={1}>{item.name}</Title>
            <Detail lines={1}>{item.categories.join(', ')}</Detail>
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

  onPressRow = (data: StudentOrgAbridgedType) => {
    tracker.trackEvent('student-org', data.name)
    this.props.navigator.push({
      id: 'StudentOrgsDetailView',
      index: this.props.route.index + 1,
      title: data.name,
      backButtonTitle: 'Orgs',
      props: {item: data},
    })
  }

  handleResults = (results: {[key: string]: StudentOrgAbridgedType[]}) => {
    this.setState({data: results})
  }

  groupData = (
    data: {[key: string]: StudentOrgAbridgedType[]},
    {searching}: {searching: boolean},
  ) => {
    let withSortableNames = map(data, item => {
      let sortableName = item.name.replace(/^(St\.? Olaf|The) +/i, '')
      return {
        ...item,
        $sortableName: sortableName,
        $groupableName: head(startCase(sortableName)),
      }
    })

    let sorted = sortBy(withSortableNames, '$sortableName')
    let grouped = groupBy(sorted, '$groupableName')

    let newOrgs = sorted.filter(org => org.newOrg)
    let orgs = searching ? grouped : {New: newOrgs, ...grouped}

    return orgs
  }

  checkIfSearching = (text: string) => {
    return text === ''
      ? this.setState({searching: false})
      : this.setState({searching: true})
  }

  searchbar: Searchbar

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    // prepare the data for the searchbar and the listview
    const grouped = this.groupData(this.state.data, {
      searching: this.state.searching,
    })

    if (!size(this.state.pureData)) {
      return <NoticeView text="No organizations found." />
    }

    return (
      <View style={styles.wrapper}>
        {/*<SearchBar
          ref={ref => this.searchBar = ref}
          style={styles.searchbar}
          data={this.state.pureData}
          handleChangeText={this.checkIfSearching}
          handleResults={this.handleResults}
          showOnLoad={true}
          hideBack={true}
          allDataOnEmptySearch={true}
          autoCorrect={false}
          focusOnLayout={false}
          iOSPadding={false}
          autoCapitalize={'none'}
        />*/}
        <StyledAlphabetListView
          data={grouped}
          cell={this.renderRow}
          getSectionListTitle={this.getSectionListTitle}
          // just setting cellHeight sends the wrong values on iOS.
          cellHeight={
            rowHeight +
              (Platform.OS === 'ios' ? 11 / 12 * StyleSheet.hairlineWidth : 0)
          }
          sectionHeader={this.renderSectionHeader}
          sectionHeaderHeight={headerHeight}
          renderSeparator={this.renderSeparator}
          showsVerticalScrollIndicator={false}
        />
      </View>
    )
  }
}
