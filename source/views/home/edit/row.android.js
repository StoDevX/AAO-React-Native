// @flow

import React from 'react'
import {View, StyleSheet, Text} from 'react-native'

import * as c from '../../components/colors'

import EntypoIcon from 'react-native-vector-icons/Entypo'
import IonIcon from 'react-native-vector-icons/Ionicons'

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
    paddingLeft: 10,
    paddingRight: 10,
    color: c.black,
  },
  viewIcon: {
    // marginRight: 20,
  },
  text: {
    flex: 1,
    flexShrink: 0,
    fontSize: 18,
    color: c.white,
  },
})

const MenuIcon = ({icon, tint}: {icon: string, tint: string}) => (
  <EntypoIcon
    name={icon}
    size={32}
    style={[styles.icon, styles.viewIcon, {color: tint}]}
  />
)

type Props = {
  data: ViewType,
  width: number,
  onMoveUp: string => any,
  onMoveDown: string => any,
}
;[]

export class EditHomeRow extends React.PureComponent<void, Props, void> {
  onMoveUp = () => {
    this.props.onMoveUp(this.props.data.view)
  }

  onMoveDown = () => {
    this.props.onMoveDown(this.props.data.view)
  }

  render() {
    const width = this.props.width - ROW_HORIZONTAL_MARGIN * 2

    return (
      <View style={[styles.row, {width}]}>
        <MenuIcon icon={this.props.data.icon} tint={this.props.data.tint} />

        <Text style={[styles.text, {color: this.props.data.tint}]}>
          {this.props.data.title}
        </Text>

        <Touchable onPress={this.onMoveUp}>
          <IonIcon name="md-arrow-up" size={32} style={styles.icon} />
        </Touchable>

        <Touchable onPress={this.onMoveDown}>
          <IonIcon name="md-arrow-down" size={32} style={styles.icon} />
        </Touchable>
      </View>
    )
  }
}
