// @flow
import React from 'react'
import {
  Text,
  ScrollView,
  StyleSheet,
  Navigator,
} from 'react-native'
import legal from '../../data/legal.json'
import NavigatorScreen from '../components/navigator-screen'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
})

function LegalContents() {
  return (
    <ScrollView style={styles.container}>
      <Text>{legal.content}</Text>
    </ScrollView>
  )
}

export default function LegalView(props: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    title={legal.title}
    navigator={props.navigator}
    renderScene={() => <LegalContents />}
  />
}
LegalView.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}
