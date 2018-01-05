// @flow
import React from 'react'
import {ScrollView, Image, StyleSheet} from 'react-native'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {Section, Cell} from 'react-native-tableview-simple'
import {icons as appIcons} from '../../../images/icon-images'
import * as c from '../components/colors'
import type {TopLevelViewPropsType} from '../types'

const styles = StyleSheet.create({
  icon: {
    width: 16,
    height: 16,
    borderColor: c.black,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
})

type IconTypeEnum = 'default' | 'icon_type_windmill'

type Icon = {
  src: any,
  title: string,
  type: IconTypeEnum,
}

export const icons: Array<Icon> = [
  {
    src: appIcons.oldMain,
    title: 'Old Main',
    type: 'default',
  },
  {
    src: appIcons.windmill,
    title: 'Wind Turbine (Big Ole)',
    type: 'icon_type_windmill',
  },
]

type Props = TopLevelViewPropsType & {}

type State = {
  iconType: ?string,
}

export class IconSettingsView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    title: 'App Icon',
  }

  state = {
    iconType: null,
  }

  componentWillMount() {
    this.getIcon()
  }

  setIcon = async (iconType: string) => {
    if (iconType === 'default') {
      await Icons.reset()
    } else {
      await Icons.setIconName(iconType)
    }

    this.getIcon()
  }

  getIcon = async () => {
    const name = await Icons.getIconName()
    this.setState(() => ({iconType: name}))
  }

  render() {
    return (
      <ScrollView>
        <Section header="CHANGE YOUR APP ICON" separatorInsetLeft={58}>
          {icons.map(icon => (
            <Cell
              key={icon.title}
              accessory={
                this.state.iconType === icon.type ? 'Checkmark' : undefined
              }
              cellStyle="RightDetail"
              disableImageResize={false}
              image={<Image source={icon.src} style={styles.icon} />}
              onPress={() => this.setIcon(icon.type)}
              title={icon.title}
            />
          ))}
        </Section>
      </ScrollView>
    )
  }
}
