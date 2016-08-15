/**
 * All About Olaf
 * iOS text input component
 */

// React native
import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native'

export default function LabelledTextInput() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Username:</Text>
      <TextInput
        style={styles.input}
        autoCapitalize='none'
        onChangeText={text => this.setState({username: text})}
        value={this.state.username}
      />
    </View>
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  label: {
    marginRight: 10,
  },
})
