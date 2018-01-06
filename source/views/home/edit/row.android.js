// @flow

import * as React from 'react'
import {View, StyleSheet, Text, Switch} from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import IonIcon from 'react-native-vector-icons/Ionicons'
import * as c from '../../components/colors'
import {Touchable} from '../../components/touchable'
import type {ViewType} from '../../views'

const ROW_HORIZONTAL_MARGIN = 15
const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.white,

    marginVertical: 5,
    marginHorizontal: ROW_HORIZONTAL_MARGIN,
    paddingVertical: 12,
    paddingRight: 10,
    borderRadius: 4,
    elevation: 1,
  },
  icon: {
    paddingHorizontal: 10,
    color: c.androidTextColor,
  },
  disabledIcon: {
    color: c.androidDisabledIcon,
  },
  text: {
    flex: 1,
    flexShrink: 0,
    fontSize: 18,
    color: c.black,
  },
})

const MenuIcon = ({icon, tint}: {icon: string, tint: string}) => (
  <EntypoIcon name={icon} size={32} style={[styles.icon, {color: tint}]} />
)

type Props = {
  item: ViewType,
  isEnabled: boolean,
  isFirst: boolean,
  isLast: boolean,
  order: string[],
  onMoveUp: (string[], string) => any,
  onMoveDown: (string[], string) => any,
  onToggle: string => any,
}

export class EditHomeRow extends React.PureComponent<Props> {
  onMoveUp = () => {
    this.props.onMoveUp(this.props.order, this.props.item.view)
  }

  onMoveDown = () => {
    this.props.onMoveDown(this.props.order, this.props.item.view)
  }

  onToggleSwitch = () => {
    this.props.onToggle(this.props.item.view)
  }

  render() {
    const {item, isFirst, isLast} = this.props
    return (
      <View style={styles.row}>
        <MenuIcon icon={this.props.item.icon} tint={item.tint} />

        <Text style={[styles.text, {color: item.tint}]}>{item.title}</Text>

        <Switch
          onValueChange={this.onToggleSwitch}
          value={this.props.isEnabled}
        />

        <ArrowIcon dir="up" disabled={isFirst} onPress={this.onMoveUp} />
        <ArrowIcon dir="down" disabled={isLast} onPress={this.onMoveDown} />
      </View>
    )
  }
}

type ArrowIconProps = {
  dir: 'up' | 'down',
  disabled: boolean,
  onPress: () => any,
}
const ArrowIcon = ({dir, disabled, onPress}: ArrowIconProps) => {
  const icon = `md-arrow-${dir}`
  const size = 24

  if (disabled) {
    return (
      <IonIcon
        name={icon}
        size={size}
        style={[styles.icon, styles.disabledIcon]}
      />
    )
  }

  return (
    <Touchable borderless={true} onPress={onPress}>
      <IonIcon name={icon} size={size} style={styles.icon} />
    </Touchable>
  )
}
