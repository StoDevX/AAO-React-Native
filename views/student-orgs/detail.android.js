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

  displayOrgName(orgName: ?string) {
    if (!orgName) {
      return null
    }

    return (
      <Text style={styles.name}>{orgName}</Text>
    )
  }

  displayCategory(orgCategory: ?string) {
    if (!orgCategory) {
      return null
    }

    return (
      <Section header='CATEGORY'>
        <Cell cellStyle='Basic' title={orgCategory} />
      </Section>
    )
  }

  displayContact(orgContact: ?string) {
    if (!orgContact) {
      return null
    }

    return (
      <Section header='CONTACT'>
        <Cell cellStyle='Basic' title={orgContact} />
      </Section>
    )
  }

  displayDescription(orgDescription: ?string) {
    if (!orgDescription) {
      return null
    }

    return (
      <Section header='DESCRIPTION'>
        <Text style={styles.description}>{orgDescription}</Text>
      </Section>
    )
  }

  displayMeetings(orgMeetingTime: string, orgMeetingLocation: string) {
    if (!orgMeetingTime && !orgMeetingLocation) {
      return null
    }

    let contents = null
    if (orgMeetingTime && orgMeetingLocation) {
      contents = <Cell cellStyle='Subtitle' title={orgMeetingTime} detail={orgMeetingLocation} />
    } else if (orgMeetingTime) {
      contents = <Cell cellStyle='Basic' title={orgMeetingTime} detail={orgMeetingLocation} />
    } else if (orgMeetingLocation) {
      contents = <Cell cellStyle='Basic' title={orgMeetingLocation} />
    }

    return (
      <Section header='MEETINGS'>
        {contents}
      </Section>
    )
  }

  renderBody = () => {
    let data = this.props.full

    if (!data) {
      return (
        <Section header='ORGANIZATION'>
          <Cell cellStyle='Basic' title='No information found.' />
        </Section>
      )
    }

    let {
      regularMeetingTime='',
      regularMeetingLocation='',
      description='',
      contactName='',
    } = data

    return (
      <View>
        {this.displayMeetings(regularMeetingTime, regularMeetingLocation)}
        {this.displayContact(contactName)}
        {this.displayDescription(description)}
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
    } else {
      contents = this.renderBody()
    }

    return (
      <ScrollView>
        <TableView>
          {this.displayOrgName(orgName)}
          {this.displayCategory(orgCategory)}
          {contents}
        </TableView>
      </ScrollView>
    )
  }
}
