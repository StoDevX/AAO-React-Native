// @flow
import * as React from 'react'
import {Text, ScrollView, Image, StyleSheet} from 'react-native'
import {data as credits} from '../../../docs/credits.json'

const image = require('../../../images/about/IconTrans.png')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
    paddingBottom: 10,
  },
  aboutText: {
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 10,
    lineHeight: 20,
    textAlign: 'justify',
  },
  title: {
    fontWeight: 'bold',
    alignSelf: 'center',
    fontSize: 18,
    paddingBottom: 5,
  },
  logo: {
    width: 100,
    height: 100,
    margin: 20,
    marginBottom: 10,
    alignSelf: 'center',
  },
  nameList: {
    textAlign: 'center',
    paddingLeft: 25,
    paddingRight: 25,
    paddingBottom: 20,
    lineHeight: 20,
  },
  last: {
    marginBottom: 30,
  },
})

export default function CreditsView() {
  let formattedContributors = credits.contributors
    .map(w => w.replace(' ', ' '))
    .join(' • ')

  let formattedAcks = credits.acknowledgements
    .map(w => w.replace(' ', ' '))
    .join(' • ')

  return (
    <ScrollView style={styles.container}>
      <Image source={image} style={styles.logo} />

      <Text style={styles.title}>{credits.name}</Text>
      <Text style={styles.aboutText}>{credits.content}</Text>

      <Text style={styles.title}>Contributors</Text>
      <Text style={styles.nameList}>{formattedContributors}</Text>

      <Text style={styles.title}>Acknowledgements</Text>
      <Text style={[styles.nameList, styles.last]}>{formattedAcks}</Text>
    </ScrollView>
  )
}
CreditsView.navigationOptions = {
  title: 'Credits',
}
