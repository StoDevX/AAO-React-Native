import React from 'react'
import {ScrollView, Text, View, StyleSheet} from 'react-native'

import {Cell, Section, TableView} from 'react-native-tableview-simple'
import { getText, parseHtml } from '../../lib/html'
import type {StudentOrgDetailPropsType} from './types'
import * as c from '../components/colors'
import LoadingView from '../components/loading'
import delay from 'delay'

const orgsUrl = 'https://api.checkimhere.com/stolaf/v1/organizations'

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  name: {
    textAlign: 'center',
    paddingTop: 14,
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
  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    route: React.PropTypes.object.isRequired,
  }

  state = {
    data: null,
    refreshing: false,
    loaded: false,
    detailsLoaded: false,
    error: false,
  }

  componentWillMount() {
    this.refresh()
  }

  props: {
    item: StudentOrgDetailPropsType,
  }

  fetchData = async () => {
    let orgUrl = orgsUrl + '/' + this.props.item.uri

    try {
      let response = await fetch(orgUrl).then(r => r.json())
      this.setState({data: response})
    } catch (error) {
      this.setState({error: true})
      console.error(error)
    }

    this.setState({loaded: true})
  }

  refresh = async () => {
    let start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({refreshing: false}))
  }

  displayOrgName(orgName) {
    if (!orgName) {
      return null
    }

    return (
      <Text style={styles.name}>{orgName}</Text>
    )
  }

  displayCategory(orgCategory) {
    if (!orgCategory) {
      return null
    }

    return (
      <Section header='CATEGORY'>
        <Cell cellStyle='Basic' title={orgCategory} />
      </Section>
    )
  }

  displayContact(orgContact) {
    if (!orgContact) {
      return null
    }

    return (
      <Section header='CONTACT'>
        <Cell cellStyle='Basic' title={orgContact} />
      </Section>
    )
  }

  displayDescription(orgDescription) {
    if (!orgDescription) {
      return null
    }

    return (
      <Section header='DESCRIPTION'>
          <Text style={styles.description}>{orgDescription}</Text>
      </Section>
    )
  }

  displayMeetings(orgMeetingTime, orgMeetingLocation) {
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

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    let data = this.state.data
    if (!data) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
        }}>
          <Text>
            No info found.
          </Text>
        </View>
      )
    }

    let orgName = data.name.trim()
    let orgCategory = data.categories.join(', ')
    let orgMeetingTime = data.regularMeetingTime.trim()
    let orgMeetingLocation = data.regularMeetingLocation.trim()
    let orgContact = data.contactName.trim()
    let orgDescription = data.description ? data.description.trim() : null

    let name = this.displayOrgName(orgName)
    let category = this.displayCategory(orgCategory)
    let meetings = this.displayMeetings(orgMeetingTime, orgMeetingLocation)
    let contact = this.displayContact(orgContact)
    let description = this.displayDescription(orgDescription)

    return (
      <ScrollView>
        <TableView>
          {name}
          {category}
          {meetings}
          {contact}
          {description}
        </TableView>
      </ScrollView>
    )
  }
}

StudentOrgsDetailView.propTypes = {
  item: React.PropTypes.shape({
    name: React.PropTypes.string.isRequired,
    categories: React.PropTypes.array.isRequired,
    memberCount: React.PropTypes.number.isRequired,
    regularMeetingTime: React.PropTypes.string,
    regularMeetingLocation: React.PropTypes.string,
    description: React.PropTypes.string,
    contactName: React.PropTypes.string,
  }).isRequired,
}
