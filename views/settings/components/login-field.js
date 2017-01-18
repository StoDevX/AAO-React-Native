// @flow
import React from 'react'
import {StyleSheet, Text, Platform, TextInput} from 'react-native'
import {CustomCell} from 'react-native-tableview-simple'
import * as c from '../../components/colors'

const styles = StyleSheet.create({
  label: {
    width: 90,
    fontSize: 16,
    marginTop: (Platform.OS === 'ios') ? -2 : 0,  // lines the label up with the text on iOS
    alignSelf: 'center',
  },
  customTextInput: {
    flex: 1,
  },
  loginCell: {
    height: (Platform.OS === 'android') ? 65 : 44,
    alignItems: 'stretch',
    paddingTop: 0,
    paddingBottom: 0,
  },
})

export class LoginField extends React.Component {
  props: {
    label: string,
    _ref: () => any,
    disabled: boolean,
    onChangeText: () => any,
    onSubmitEditing: () => any,
    placeholder: string,
    returnKeyType: 'done'|'next',
    secureTextEntry: boolean,
    value: string,
  };

  _input: any;
  focusInput = () => this._input.focus();

  cacheRef = (ref: any) => {
    this._input = ref
    this.props._ref(ref)
  }

  render() {
    return (
      <CustomCell contentContainerStyle={styles.loginCell}>
        <Text onPress={this.focusInput} style={styles.label}>{this.props.label}</Text>
        <TextInput
          ref={this.cacheRef}
          autoCapitalize='none'
          autoCorrect={false}
          cellStyle='Basic'
          clearButtonMode='while-editing'
          disabled={this.props.disabled}
          onChangeText={this.props.onChangeText}
          onSubmitEditing={this.props.onSubmitEditing}
          placeholder={this.props.placeholder}
          placeholderTextColor={c.iosPlaceholderText}
          returnKeyType={this.props.returnKeyType}
          secureTextEntry={this.props.secureTextEntry}
          style={styles.customTextInput}
          value={this.props.value}
        />
      </CustomCell>
    )
  }
}
