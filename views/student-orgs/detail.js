// @flow
import React from 'react'
import {ScrollView, Text, View, StyleSheet} from 'react-native'

import {Cell, Section, TableView} from 'react-native-tableview-simple'
import * as c from '../components/colors'
import {getTextWithSpaces, parseHtml} from '../../lib/html'
import type {StudentOrgInfoType, StudentOrgAbridgedType} from './types'
import type {TopLevelViewPropsType} from '../types'

const orgsUrl = 'https://api.checkimhere.com/stolaf/v1/organizations'

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

export class StudentOrgsDetailView extends React.Component {
  state: {
    data: ?StudentOrgInfoType,
    refreshing: boolean,
    loaded: boolean,
    error: boolean,
  } = {
    data: null,
    refreshing: false,
    loaded: false,
    error: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  props: TopLevelViewPropsType & {
    item: StudentOrgAbridgedType,
  }

  fetchData = async () => {
    let orgUrl = orgsUrl + '/' + this.props.item.uri

    try {
      let response = await fetchJson(orgUrl)
      this.setState({data: response})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }

    this.setState({loaded: true})
  }

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

    orgDescription = getTextWithSpaces(parseHtml(orgDescription))
    orgDescription = orgDescription.split(/\s+/).join(' ')

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
    let data = this.state.data

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

    contactName = contactName.trim()
    description = description.trim()
    regularMeetingTime = regularMeetingTime.trim()
    regularMeetingLocation = regularMeetingLocation.trim()

    return (
      <View>
        {this.displayMeetings(regularMeetingTime, regularMeetingLocation)}
        {this.displayContact(contactName)}
        {this.displayDescription(description)}
      </View>
    )
  }

  render() {
    let knownData = this.props.item
    let orgName = knownData.name.trim()
    let orgCategory = knownData.categories.join(', ')

    let contents
    if (!this.state.loaded) {
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
