// @flow

import * as React from 'react'
import {Animated, Easing, StyleSheet, Text, Switch} from 'react-native'

import * as c from '../../components/colors'

import EntypoIcon from 'react-native-vector-icons/Entypo'
import IonIcon from 'react-native-vector-icons/Ionicons'

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

    borderRadius: 4,

    shadowColor: c.semitransparentGray,
    shadowOpacity: 1,
    shadowOffset: {height: 0, width: 0},
  },
  icon: {
    paddingLeft: 10,
    paddingRight: 10,
    color: c.black,
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
  active: boolean,
  data: ViewType,
  isEnabled: boolean,
  onToggle: string => any,
  width: number,
}

type State = {
  style: {
    shadowRadius: Animated.Value,
    transform: Array<{[key: string]: Animated.Value}>,
    opacity: Animated.Value,
    elevation: Animated.Value,
  },
}

export class EditHomeRow extends React.Component<Props, State> {
  static startStyle = {
    shadowRadius: 2,
    transform: [{scale: 1}],
    opacity: 1,
    elevation: 2,
  }

  static endStyle = {
    shadowRadius: 10,
    transform: [{scale: 1.05}],
    opacity: 0.65,
    elevation: 4,
  }

  state = {
    style: {
      shadowRadius: new Animated.Value(EditHomeRow.startStyle.shadowRadius),
      transform: [
        {scale: new Animated.Value(EditHomeRow.startStyle.transform[0].scale)},
      ],
      opacity: new Animated.Value(EditHomeRow.startStyle.opacity),
      elevation: new Animated.Value(EditHomeRow.startStyle.elevation),
    },
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.active === nextProps.active) {
      return
    }

    if (nextProps.active) {
      this.startActivationAnimation()
    } else {
      this.startDeactivationAnimation()
    }
  }

  startActivationAnimation = () => {
    const {transform, shadowRadius, opacity, elevation} = this.state.style
    Animated.parallel([
      Animated.timing(transform[0].scale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: EditHomeRow.endStyle.transform[0].scale,
      }),
      Animated.timing(shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: EditHomeRow.endStyle.shadowRadius,
      }),
      Animated.timing(opacity, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: EditHomeRow.endStyle.opacity,
      }),
      Animated.timing(elevation, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: EditHomeRow.endStyle.elevation,
      }),
    ]).start()
  }

  startDeactivationAnimation = () => {
    const {transform, shadowRadius, opacity, elevation} = this.state.style
    Animated.parallel([
      Animated.timing(transform[0].scale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: EditHomeRow.startStyle.transform[0].scale,
      }),
      Animated.timing(shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: EditHomeRow.startStyle.shadowRadius,
      }),
      Animated.timing(opacity, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: EditHomeRow.startStyle.opacity,
      }),
      Animated.timing(elevation, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: EditHomeRow.startStyle.elevation,
      }),
    ]).start()
  }

  onToggleSwitch = () => {
    this.props.onToggle(this.props.data.view)
  }

  render() {
    const width = this.props.width - ROW_HORIZONTAL_MARGIN * 2

    return (
      <Animated.View style={[styles.row, this.state.style, {width}]}>
        <MenuIcon icon={this.props.data.icon} tint={this.props.data.tint} />

        <Text style={[styles.text, {color: this.props.data.tint}]}>
          {this.props.data.title}
        </Text>

        <Switch
          onValueChange={this.onToggleSwitch}
          value={this.props.isEnabled}
        />

        <IonIcon name="ios-reorder" size={32} style={[styles.icon]} />
      </Animated.View>
    )
  }
}
