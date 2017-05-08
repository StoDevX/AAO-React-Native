// @flow
/**
 * All About Olaf
 * StudentOrgs page
 */

import React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
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
import {tracker} from '../../analytics'
import bugsnag from '../../bugsnag'
import size from 'lodash/size'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import * as c from '../components/colors'
import startCase from 'lodash/startCase'
import type {StudentOrgAbridgedType} from './types'

const orgsUrl = 'https://api.presence.io/stolaf/v1/organizations'
const leftSideSpacing = 20
const rowHeight = Platform.OS === 'ios' ? 58 : 74
const headerHeight = Platform.OS === 'ios' ? 33 : 41

const styles = StyleSheet.create({
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
  state: {
    orgs: {[key: string]: StudentOrgAbridgedType[]},
    refreshing: boolean,
    error: boolean,
    loaded: boolean,
  } = {
    orgs: {},
    refreshing: false,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.refresh()
  }

  props: TopLevelViewPropsType

  fetchData = async () => {
    try {
      let responseData: StudentOrgAbridgedType[] = await fetchJson(orgsUrl)
      let withSortableNames = map(responseData, item => {
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
      let orgs = {New: newOrgs, ...grouped}

      this.setState({orgs: orgs})
    } catch (err) {
      tracker.trackException(err.message)
      bugsnag.notify(err)
      this.setState({error: true})
      console.error(err)
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

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (!size(this.state.orgs)) {
      return <NoticeView text="No organizations found." />
    }

    return (
      <StyledAlphabetListView
        data={this.state.orgs}
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
    )
  }
}
