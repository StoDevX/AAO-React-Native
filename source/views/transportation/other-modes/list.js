// @flow
import * as React from 'react'
import delay from 'delay'
import {OtherModesRow} from './row'
import {reportNetworkProblem} from '../../../lib/report-network-problem'
import {TabBarIcon} from '../../components/tabbar-icon'
import * as defaultData from '../../../../docs/transportation.json'
import * as c from '../../components/colors'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import {ListEmpty} from '../../components/list'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import type {TopLevelViewPropsType} from '../../types'
import type {OtherModeType} from '../types'

const GITHUB_URL =
  'https://stodevx.github.io/AAO-React-Native/transportation.json'

const groupModes = (modes: OtherModeType[]) => {
  const grouped = groupBy(modes, m => m.category)
  return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

type Props = TopLevelViewPropsType

type State = {
  modes: Array<OtherModeType>,
  loading: boolean,
  refreshing: boolean,
}

export class OtherModesView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    tabBarLabel: 'Other Modes',
    tabBarIcon: TabBarIcon('boat'),
  }

  state = {
    modes: defaultData.data,
    loading: true,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData().then(() => {
      this.setState(() => ({loading: false}))
    })
  }

  refresh = async (): any => {
    const start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState(() => ({refreshing: false}))
  }

  fetchData = async () => {
    let {data: modes} = await fetchJson(GITHUB_URL).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })

    if (process.env.NODE_ENV === 'development') {
      modes = defaultData.data
    }

    this.setState(() => ({modes}))
  }

  onPress = (mode: OtherModeType) => {
    this.props.navigation.navigate('OtherModesDetailView', {
      mode,
    })
  }

  renderSectionHeader = ({section: {title}}: any) => (
    <ListSectionHeader title={title} />
  )

  renderItem = ({item}: {item: OtherModeType}) => (
    <OtherModesRow mode={item} onPress={this.onPress} />
  )

  keyExtractor = (item: OtherModeType) => item.name

  render() {
    const groupedData = groupModes(this.state.modes)
    return (
      <SectionList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<ListEmpty mode="bug" />}
        data={groupedData}
        keyExtractor={this.keyExtractor}
        onRefresh={this.refresh}
        refreshing={this.state.refreshing}
        renderItem={this.renderItem}
        renderSectionHeader={this.renderSectionHeader}
        sections={groupedData}
        style={styles.listContainer}
      />
    )
  }
}
