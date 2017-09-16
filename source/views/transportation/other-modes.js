// @flow
import React from 'react'
import {FlatList} from 'react-native'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import {TabBarIcon} from '../components/tabbar-icon'
import type {OtherModeType} from './types'
import * as defaultData from '../../../docs/transportation.json'
import * as c from '../components/colors'
import {Button} from '../components/button'
import {trackedOpenUrl} from '../components/open-url'
import {Markdown} from '../components/markdown'
import glamorous from 'glamorous-native'

const Title = glamorous.text({
  fontSize: 30,
  alignSelf: 'center',
  marginTop: 10,
})

const Container = glamorous.view({
  backgroundColor: c.white,
  paddingHorizontal: 10,

  borderWidth: 5,
  borderTopWidth: 1,
  borderColor: c.iosLightBackground,
})

const GITHUB_URL =
  'https://stodevx.github.io/AAO-React-Native/transportation.json'

class OtherModeCard extends React.PureComponent {
  props: {
    data: OtherModeType,
  }

  onPress = () => {
    const {data} = this.props
    const modeName = data.name.replace(' ', '')
    return trackedOpenUrl({
      url: data.url,
      id: `Transportation_OtherModes_${modeName}View`,
    })
  }

  render() {
    const {data} = this.props
    return (
      <Container>
        <Title selectable={true}>{data.name}</Title>
        <Markdown source={data.description} />
        <Button onPress={this.onPress} title="More Info" />
      </Container>
    )
  }
}

export default class OtherModesView extends React.PureComponent {
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
    this.fetchData()
  }

  refresh = async () => {
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
    this.setState(() => ({loading: true}))

    let {data: modes} = await fetchJson(GITHUB_URL).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })

    if (process.env.NODE_ENV === 'development') {
      modes = defaultData.data
    }

    this.setState(() => ({modes, loading: false}))
  }

  renderItem = ({item}: {item: OtherModeType}) => <OtherModeCard data={item} />

  keyExtractor = (item: OtherModeType) => item.name

  render() {
    return (
      <FlatList
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
        data={this.state.modes}
      />
    )
  }
}
