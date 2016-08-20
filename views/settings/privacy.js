// @flow
import React from 'react'
import {
  Text,
  ScrollView,
  StyleSheet,
  Navigator,
} from 'react-native'
import privacy from '../../data/privacy.json'
import NavigatorScreen from '../components/navigator-screen'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
})

function PrivacyContents() {
  return (
    <ScrollView style={styles.container}>
      <Text>{privacy.text}</Text>
    </ScrollView>
  )
}

export default function PrivacyView(props: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    title={privacy.title}
    navigator={props.navigator}
    renderScene={() => <PrivacyContents />}
  />
}
PrivacyView.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}
