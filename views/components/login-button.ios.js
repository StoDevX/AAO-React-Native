/**
 * All About Olaf
 * iOS LoginButton component
 */

import React from 'react'
import {StyleSheet} from 'react-native'
import RNButton from 'react-native-button'
import * as c from './colors'

const styles = StyleSheet.create({
  button: {
    // fontSize: 20,
    // flexDirection: 'row',
    // justifyContent: 'flex-start',
    // alignItems: 'center',
    // textAlignVertical: 'center',
  },
  container: {
    borderColor: c.iosGray,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
})

export default function LoginButton(props) {
  return (
    <RNButton
      containerStyle={[styles.container, props.containerStyle]}
      style={[styles.button, props.style]}
      styleDisabled={[styles.disabled, props.disabledStyle]}
      onPress={props.onPress}
      disabled={props.disabled}
    >
      {props.children}
    </RNButton>
  )
}

LoginButton.propTypes = {
  containerStyle: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.object,
  ]),
  style: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.object,
  ]),
  disabledStyle: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.object,
  ]),
  onPress: React.PropTypes.func,
  disabled: React.PropTypes.bool,
}

LoginButton.defaultProps = {
  onPress: () => {},
  disabled: false,
}
