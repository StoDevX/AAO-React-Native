// @flow
import React from 'react'
import {ScrollView, Text, View, StyleSheet} from 'react-native'

import {Cell, Section, TableView} from 'react-native-tableview-simple'
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
  description: {
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
    backgroundColor: c.white,
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
      <Section header='CONTACT'>
        <Cell cellStyle='Basic' title={contactInfo} />
      </Section>
    )
  }

  displayDescription(description: string) {
    return (
      <Section header='DESCRIPTION'>
        <Text style={styles.description}>{description}</Text>
      </Section>
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
      <Section header='MEETINGS'>
        {contents}
      </Section>
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
        <Section header='ORGANIZATION'>
          <Cell cellStyle='Basic' title='Loading…' />
        </Section>
      )
    } else if (!this.props.full) {
      contents = (
        <Section header='ORGANIZATION'>
          <Cell cellStyle='Basic' title='No information found.' />
        </Section>
      )
    } else {
      contents = this.renderBody(this.props.full)
    }

    return (
      <ScrollView>
        <TableView>
          <Text style={styles.name}>{orgName}</Text>

          <Section header='CATEGORY'>
            <Cell cellStyle='Basic' title={orgCategory} />
          </Section>

          {contents}
        </TableView>
      </ScrollView>
    )
  }
}
