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
import {ListRow, ListSectionHeader, ListSeparator, Detail, Title} from '../components/list'
import size from 'lodash/size'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import * as c from '../components/colors'
import startCase from 'lodash/startCase'
import type {StudentOrgAbridgedType} from './types'

const orgsUrl = 'https://api.checkimhere.com/stolaf/v1/organizations'
const leftSideSpacing = 20
const rowHeight = Platform.OS === 'ios' ? 53 : 74
const headerHeight = Platform.OS === 'ios' ? 27 : 41

const styles = StyleSheet.create({
  row: {
    height: rowHeight,
  },
  rowSectionHeader: {
    height: headerHeight,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: Platform.OS === 'ios' ? 24: 28,
    color: 'transparent',
  },
})

export class StudentOrgsView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    route: React.PropTypes.object.isRequired,
  }

  state: {
    orgs: StudentOrgAbridgedType[],
    refreshing: boolean,
    error: boolean,
    loaded: boolean,
  } = {
    orgs: [],
    refreshing: false,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.refresh()
  }

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
      this.setState({orgs: grouped})
    } catch (error) {
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

  renderRow = ({isLast, item}: {isLast: boolean, item: StudentOrgAbridgedType}) => {
    return (
      <View>
        <ListRow
          onPress={() => this.onPressRow(item)}
          contentContainerStyle={styles.row}
          arrowPosition='top'
        >
          <Row>
            <NewOrgBadge newOrg={item.newOrg} />

            <Column>
              <Title lines={1}>{item.name}</Title>
              <Detail lines={1}>{item.categories.join(', ')}</Detail>
            </Column>
          </Row>
        </ListRow>

        {!isLast ? <ListSeparator spacing={{left: leftSideSpacing}} /> : null}
      </View>
    )
  }

  onPressRow = (data: StudentOrgAbridgedType) => {
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
      return <NoticeView text='No organizations found.' />
    }

    return (
      <StyledAlphabetListView
        data={this.state.orgs}
        cell={this.renderRow}
        // just setting cellHeight sends the wrong values on iOS.
        cellHeight={rowHeight + (Platform.OS === 'ios' ? (11/12 * StyleSheet.hairlineWidth) : 0)}
        sectionHeader={this.renderSectionHeader}
        sectionHeaderHeight={headerHeight}
        showsVerticalScrollIndicator={false}
      />
    )
  }
}

const NewOrgBadge = ({newOrg}: {newOrg: boolean}) => {
  return (
    <View style={[styles.badge, {width: leftSideSpacing, alignSelf: 'flex-start'}]}>
      <Text style={[styles.badgeIcon, newOrg && {color: c.infoBlue}]}>•</Text>
    </View>
  )
}
