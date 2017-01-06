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
import {ListRow} from '../components/list-row'
import {ListSectionHeader} from '../components/list-section-header'
import {ListSeparator} from '../components/list-separator'
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

const styles = StyleSheet.create({
  row: {
    height: rowHeight,
  },
  textRows: {
    flexDirection: 'column',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: Platform.OS === 'ios' ? 24: 28,
    color: 'transparent',
  },
  itemTitle: {
    color: c.black,
    fontWeight: '500',
    paddingBottom: 1,
    fontSize: 16,
  },
  itemPreview: {
    color: c.iosDisabledText,
    fontSize: 13,
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
        // hide the _very first_ border on android
        style={Platform.OS === 'android' && title === 'A' ? {borderTopWidth: 0} : null}
      />
    )
  }

  renderRow = ({isLast, item}: {isLast: boolean, item: StudentOrgAbridgedType}) => {
    return (
      <View>
        <ListRow
          onPress={() => this.onPressRow(item)}
          contentContainerStyle={styles.row}
          style={{flexDirection: 'row'}}
          fullWidth={true}
          arrowPosition='top'
        >
          <View style={[styles.badge, {width: leftSideSpacing, alignSelf: 'flex-start'}]}>
            <Text style={[styles.badgeIcon, item.newOrg && {color: c.infoBlue}]}>•</Text>
          </View>
          <View style={[styles.textRows, {flex: 1}]}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemPreview} numberOfLines={1}>{item.categories.join(', ')}</Text>
          </View>
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
        cellHeight={rowHeight}
        sectionHeader={this.renderSectionHeader}
        sectionHeaderHeight={28}
        showsVerticalScrollIndicator={false}
      />
    )
  }
}
