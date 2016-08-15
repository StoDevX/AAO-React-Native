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
    // alignItems: 'flex-start',
    // justifyContent: 'flex-start',
    borderColor: c.iosGray,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    // flex: 1,
  },
  disabled: {

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
  children: React.PropTypes.node.isRequired,
  containerStyle: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.object,
  ]),
  disabled: React.PropTypes.bool,
  disabledStyle: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.object,
  ]),
  onPress: React.PropTypes.func,
  style: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.object,
  ]),
}

LoginButton.defaultProps = {
  onPress: () => {},
}
