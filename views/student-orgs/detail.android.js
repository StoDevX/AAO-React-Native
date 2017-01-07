// @flow
import React from 'react'
import {ScrollView, Text, View, StyleSheet} from 'react-native'

import {Cell} from 'react-native-tableview-simple'
import {Card} from '../components/card'
import * as c from '../components/colors'
import type {StudentOrgInfoType, StudentOrgAbridgedType} from './types'

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  name: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 5,
    color: 'black',
    fontSize: 32,
    fontWeight: '300',
  },
  card: {
    marginBottom: 20,
  },
  cardBody: {
    color: c.black,
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
  },
})

export class StudentOrgsDetailRenderView extends React.Component {
  props: {
    loaded: boolean,
    base: StudentOrgAbridgedType,
    full: ?StudentOrgInfoType,
  };

  displayContact(contactInfo: string) {
    return (
      <Card header='Contact' style={styles.card}>
        <Text style={styles.cardBody}>{contactInfo}</Text>
      </Card>
    )
  }

  displayDescription(description: string) {
    return (
      <Card header='Description' style={styles.card}>
        <Text style={styles.cardBody}>{description}</Text>
      </Card>
    )
  }

  displayMeetings(meetingTime: string, meetingLocation: string) {
    let contents = null
    if (meetingTime && meetingLocation) {
      contents = <Cell cellStyle='Subtitle' title={meetingTime} detail={meetingLocation} />
    } else if (meetingTime) {
      contents = <Cell cellStyle='Basic' title={meetingTime} detail={meetingLocation} />
    } else if (meetingLocation) {
      contents = <Cell cellStyle='Basic' title={meetingLocation} />
    }

    return (
      <Card header='Meetings' style={styles.card}>
        {contents}
      </Card>
    )
  }

  renderBody = (data: StudentOrgInfoType) => {
    const {
      regularMeetingTime='',
      regularMeetingLocation='',
      description='',
      contactName='',
    } = data

    const showMeetingSection = regularMeetingTime && regularMeetingLocation

    return (
      <View>
        {showMeetingSection ? this.displayMeetings(regularMeetingTime, regularMeetingLocation) : null}
        {contactName ? this.displayContact(contactName) : null}
        {description ? this.displayDescription(description) : null}
      </View>
    )
  }

  render() {
    let knownData = this.props.base
    let orgName = knownData.name.trim()
    let orgCategory = knownData.categories.join(', ')

    let contents
    if (!this.props.loaded) {
      contents = (
        <Card header='Organization' style={styles.card}>
          <Text style={styles.cardBody}>Loading…</Text>
        </Card>
      )
    } else if (!this.props.full) {
      contents = (
        <Card header='Organization' style={styles.card}>
          <Text style={styles.cardBody}>No information found.</Text>
        </Card>
      )
    } else {
      contents = this.renderBody(this.props.full)
    }

    return (
      <ScrollView>
        <Text style={styles.name}>{orgName}</Text>

        <Card header='Category' style={styles.card}>
          <Text style={styles.cardBody}>{orgCategory}</Text>
        </Card>

        {contents}
      </ScrollView>
    )
  }
}
