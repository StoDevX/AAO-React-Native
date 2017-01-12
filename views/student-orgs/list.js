// @flow
/**
 * All About Olaf
 * StudentOrgs page
 */

import React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AlphabetListView from 'react-native-alphabetlistview'
import LoadingView from '../components/loading'
import delay from 'delay'
import {Touchable} from '../components/touchable'
import {tracker} from '../../analytics'
import size from 'lodash/size'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import * as c from '../components/colors'
import startCase from 'lodash/startCase'
import type {StudentOrgAbridgedType} from './types'

const orgsUrl = 'https://api.checkimhere.com/stolaf/v1/organizations'

let styles = StyleSheet.create({
  listView: {
    paddingRight: 16,
    backgroundColor: c.white,
  },
  textRows: {
    paddingTop: 8,
    paddingBottom: 8,
    height: 53,
    flexDirection: 'column',
    flex: 1,
  },
  notLastRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8c7cc',
  },
  itemNew: {
    marginLeft: -15,
    marginRight: 5,
    width: 11,
    fontSize: 28,
  },
  itemTitle: {
    color: c.black,
    fontWeight: '500',
    paddingBottom: 1,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosDisabledText,
    fontSize: 13,
    textAlign: 'left',
  },
  rowSectionHeader: {
    backgroundColor: c.iosListSectionHeader,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 20,
    height: 27,
    borderBottomWidth: 1,
    borderColor: '#ebebeb',
  },
  rowSectionHeaderText: {
    color: 'black',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 20,
  },
  arrowIcon: {
    color: c.iosDisabledText,
    fontSize: 20,
    marginRight: 6,
    marginLeft: 4,
    marginTop: 8,
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

  renderHeader = ({title}: {title: string}) => {
    return (
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>{title}</Text>
      </View>
    )
  }

  renderRow = ({isLast, item}: {isLast: boolean, item: StudentOrgAbridgedType}) => {
    return (
      <Touchable onPress={() => this.onPressRow(item)} style={[styles.row, !isLast && styles.notLastRow]}>
        <Text style={[styles.itemNew, {color: item.newOrg ? c.infoBlue : 'transparent'}]}>• </Text>
        <View style={styles.textRows}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemPreview}>{item.categories.join(', ')}</Text>
        </View>
        <Icon style={styles.arrowIcon} name='ios-arrow-forward' />
      </Touchable>
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
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}>
          <Text>
            No organizations found.
          </Text>
        </View>
      )
    }

    return (
      <AlphabetListView
        contentContainerStyle={styles.listView}
        data={this.state.orgs}
        cell={this.renderRow}
        sectionHeader={this.renderHeader}
        sectionHeaderHeight={28}
        cellHeight={53}
        showsVerticalScrollIndicator={false}
      />
    )
  }
}
