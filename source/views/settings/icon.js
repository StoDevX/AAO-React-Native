// @flow
import React from 'react'
import {View, Image, StyleSheet, Text} from 'react-native'
import Icons from 'react-native-alternate-icons'
import {Section, Cell} from 'react-native-tableview-simple'
import {Column} from '../components/layout'
import includes from 'lodash/includes'

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingVertical: 10,
  },
  title: {
    fontSize: 16,
  },
  icon: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 0.5,
  },
})

const icons = [
  {
    type: 'default',
    src: require('../../../images/about/IconTrans.png'),
    title: 'Old Main',
  },
  {
    type: 'icon_type_windmill',
    src: require('../../../ios/AllAboutOlaf/windmill.png'),
    title: 'Windmill',
  },
]

export default class IconSettingsView extends React.PureComponent {
  static navigationOptions = {
    title: 'App Icon',
  }

  state: {
    iconType: string,
  } = {
    iconType: '',
  }

  componentWillMount() {
    this.getIcon()
  }

  setIcon(iconType: string) {
    iconType == 'default' ? Icons.reset() : Icons.setIconName(iconType)
    this.getIcon()
  }

  getIcon() {
    Icons.getIconName(name => this.setState(() => ({iconType: name})))
  }

  render() {
    return (
      <View>
        <Section header={'CHANGE YOUR APP ICON'} separatorInsetLeft={58}>
          {icons.map(val => (
            <Cell
              key={val.title}
              onPress={() => this.setIcon(val.type)}
              disableImageResize={false}
              image={
                val.type ? (
                  <Image style={styles.icon} source={val.src} />
                ) : (
                  undefined
                )
              }
              accessory={
                includes(this.state.iconType, val.type)
                  ? 'Checkmark'
                  : undefined
              }
              cellStyle="RightDetail"
              cellContentView={
                <Column style={styles.content}>
                  <Text style={styles.title}>{val.title}</Text>
                </Column>
              }
            />
          ))}
        </Section>
      </View>
    )
  }
}
