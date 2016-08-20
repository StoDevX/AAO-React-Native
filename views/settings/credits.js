// @flow
import React from 'react'
import {
  Text,
  ScrollView,
  StyleSheet,
  Navigator,
} from 'react-native'
import credits from '../../data/credits.json'
import NavigatorScreen from '../components/navigator-screen'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
  aboutText: {
    marginBottom: 10,
  },
  nameList: {
    alignSelf: 'center',
  },
})

function CreditsContents() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.aboutText}>{credits.content}</Text>
      <Text style={styles.nameList}>Contributers: {credits.contributers}</Text>
      <Text style={styles.nameList}>Acknowledgements: {credits.acknowledgements}</Text>
    </ScrollView>
  )
}

export default function CreditsView(props: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    title={credits.title}
    navigator={props.navigator}
    renderScene={() => <CreditsContents />}
  />
}
CreditsView.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}
