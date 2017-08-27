// @flow

import React from 'react'
import {Animated, Easing, StyleSheet, Text} from 'react-native'
import * as c from '../../components/colors'
import {MenuIcon, ReorderIcon} from './icons'
import type {VisibleHomescreenViewType} from '../../app/types'

type RowProps = {
  data: VisibleHomescreenViewType,
  active: boolean,
}

export class Row extends React.Component {
  props: RowProps

  state = {
    style: {
      shadowRadius: new Animated.Value(2),
      transform: [{scale: new Animated.Value(1)}],
      opacity: new Animated.Value(1.0),
      elevation: new Animated.Value(2),
    },
  }

  componentWillReceiveProps(nextProps: RowProps) {
    if (this.props.active !== nextProps.active) {
      if (nextProps.active) {
        this.startActivationAnimation()
      } else {
        this.startDeactivationAnimation()
      }
    }
  }

  startActivationAnimation = () => {
    const {style} = this.state
    Animated.parallel([
      Animated.timing(style.transform[0].scale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 1.05,
      }),
      Animated.timing(style.shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 10,
      }),
      Animated.timing(style.opacity, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 0.65,
      }),
      Animated.timing(style.elevation, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 4,
      }),
    ]).start()
  }

  startDeactivationAnimation = () => {
    const {style} = this.state
    Animated.parallel([
      Animated.timing(style.transform[0].scale, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 1,
      }),
      Animated.timing(style.shadowRadius, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 2,
      }),
      Animated.timing(style.opacity, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 1.0,
      }),
      Animated.timing(style.elevation, {
        duration: 100,
        easing: Easing.out(Easing.quad),
        toValue: 2,
      }),
    ]).start()
  }

  render() {
    return (
      <Animated.View style={[styles.row, this.state.style]}>
        <MenuIcon view={this.props.data} />
        <Text style={[styles.text, {color: this.props.data.tint}]}>
          {this.props.data.title}
        </Text>
        <ReorderIcon />
      </Animated.View>
    )
  }
}

let styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.white,
    width: window.width - 15 * 2,
    marginVertical: 5,
    marginHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 4,
    shadowColor: c.semitransparentGray,
    shadowOpacity: 1,
    shadowOffset: {height: 2, width: 2},
    shadowRadius: 2,
    opacity: 1.0,
    elevation: 2,
  },
  text: {
    flex: 1,
    fontSize: 18,
    color: c.white,
  },
})
