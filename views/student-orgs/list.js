/**
 * All About Olaf
 * StudentOrgs page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  TouchableHighlight,
  ListView,
  Text,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AlphabetListView from 'react-native-alphabetlistview'
import LoadingView from '../components/loading'
import delay from 'delay'

import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import * as c from '../components/colors'
import { getText, parseHtml } from '../../lib/html'
import startCase from 'lodash/startCase'

const orgsUrl = 'https://api.checkimhere.com/stolaf/v1/organizations'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listView: {
    paddingRight: 16,
  },
  textRows: {
    marginLeft: 20,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
    flexDirection: 'column',
    flex: 1,
  },
  notLastRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8c7cc',
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

  state = {
    dataSource: null,
    refreshing: false,
    loaded: false,
    loadedDetail: false,
    error: false,
    noOrgs: false,
  }

  componentWillMount() {
    this.refresh()
  }

  fetchData = async () => {
    try {
      let response = await fetch(orgsUrl).then(r => r.json())
      if (!response.length) {
        this.setState({noOrgs: true})
      }
      this.setState({dataSource: response})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }

    this.setState({loaded: true})
  }

  fetchDetailData = async url => {
    let detailData = null
    try {
      let response = await fetch(url).then(r => r.json())
      detailData = response
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }

    this.setState({loadedDetail: true})

    if (this.state.loadedDetail) {
      this.props.navigator.push({
        id: 'StudentOrgsDetailView',
        index: this.props.route.index + 1,
        title: detailData.name,
        backButtonTitle: 'Orgs',
        props: {item: detailData},
      })
    }
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

  renderHeader = ({title}) => {
    return (
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>{title}</Text>
      </View>
    )
  }

  renderRow = ({isLast, item}) => {
    let orgName = getText(parseHtml(item.name))
    let orgCategory = getText(parseHtml(item.categories[0]))

    return (
      <TouchableHighlight underlayColor={'#ebebeb'} onPress={() => this.onPressRow(item)}>
        <View style={[styles.row, !isLast && styles.notLastRow]}>
          <View style={[styles.textRows]}>
            <Text style={styles.itemTitle} numberOfLines={1}>{orgName}</Text>
            <Text style={styles.itemPreview}>{orgCategory}</Text>
          </View>
          <Icon style={[styles.arrowIcon]} name='ios-arrow-forward' />
        </View>
      </TouchableHighlight>
    )
  }


  onPressRow = data => {
    let orgUrl = orgsUrl + '/' + data.uri
    this.fetchDetailData(orgUrl)
  }

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (this.state.noOrgs) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}>
          <Text>
            No Organizations Found.
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.container}>
      <AlphabetListView
        contentContainerStyle={styles.listView}
        data={groupBy(this.state.dataSource, item => head(startCase(item.name)))}
        cell={this.renderRow}
        sectionHeader={this.renderHeader}
        sectionHeaderHeight={28}
        cellHeight={70}
        showsVerticalScrollIndicator={false}
      />
      </View>
    )
  }
}
