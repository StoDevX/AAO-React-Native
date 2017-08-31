// @flow
import React from 'react'
import {FlatList} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import type {OtherModeType} from './types'
import {data as modes} from '../../../docs/transportation.json'
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

  renderItem = ({item}: {item: OtherModeType}) => <OtherModeCard data={item} />

  keyExtractor = (item: OtherModeType) => item.name

  render() {
    return (
      <FlatList
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        data={modes}
      />
    )
  }
}
