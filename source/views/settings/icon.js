// @flow
import React from 'react'
import {View} from 'react-native'
import {ButtonCell} from '../components/cells/button'
import ReactNativeDynamicIcon from 'react-native-dynamic-icon'

export default class IconSettingsView extends React.PureComponent {
  static navigationOptions = {
    title: 'App Icon',
  }

  setIconName(iconType: string) {
    ReactNativeDynamicIcon.setIconName(iconType)
  }

  render() {
    return (
      <View>
        <ButtonCell
          title="Default"
          onPress={() => this.setIconName('__default__')}
        />
        <ButtonCell
          title="Windmill"
          onPress={() => this.setIconName('icon_type_windmill')}
        />
      </View>
    )
  }
}
