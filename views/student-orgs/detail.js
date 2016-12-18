import React from 'react'
import {ScrollView, Text, Image, Dimensions, StyleSheet} from 'react-native'

import {Cell, Section, TableView} from 'react-native-tableview-simple'
import { getText, parseHtml } from '../../lib/html'
import * as c from '../components/colors'

let orgPhotoBase = 'https://az795308.vo.msecnd.net/organizationphotos/'

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

function displayName(orgName) {
  if (!orgName) {
    return null
  }

  return (
    <Text style={styles.name}>{orgName}</Text>
  )
}

function displayImage(orgImage) {
  if (!orgImage) {
    return null
  }

  let orgPhotoUrl = orgPhotoBase + orgImage
  let orgPhoto = <Image style={{width: Dimensions.width, height: 100}} source={{uri: orgPhotoUrl}} />

  return orgPhoto
}

function displayCategory(orgCategory) {
  if (!orgCategory) {
    return null
  }

  return (
    <Section header='CATEGORY'>
      <Cell cellStyle='Basic' title={orgCategory} />
    </Section>
  )
}

function displayContact(orgContact) {
  if (!orgContact) {
    return null
  }

  return (
    <Section header='CONTACT'>
      <Cell cellStyle='Basic' title={orgContact} />
    </Section>
  )
}

function displayDescription(orgDescription) {
  if (!orgDescription) {
    return null
  }

  return (
    <Section header='DESCRIPTION'>
        <Text style={styles.description}>{orgDescription}</Text>
    </Section>
  )
}

function displayMeetings(orgMeetingTime, orgMeetingLocation) {
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

export function StudentOrgsDetailView(props) {
  let orgImage = getText(parseHtml(props.item.photoUri)) || ''
  let orgName = getText(parseHtml(props.item.name)) || ''
  let orgCategory = getText(parseHtml(props.item.categories)) || ''
  let orgMeetingTime = getText(parseHtml(props.item.regularMeetingTime)) || ''
  let orgMeetingLocation = getText(parseHtml(props.item.regularMeetingLocation)) || ''
  let orgContact = getText(parseHtml(props.item.contactName)) || ''
  let orgDescription = getText(parseHtml(props.item.description)) || ''

  let image = displayImage(orgImage)
  let name = displayName(orgName)
  let category = displayCategory(orgCategory)
  let meetings = displayMeetings(orgMeetingTime, orgMeetingLocation)
  let contact = displayContact(orgContact)
  let description = displayDescription(orgDescription)

  return (
    <ScrollView>
      <TableView>
        {image}
        {name}
        {category}
        {meetings}
        {contact}
        {description}
      </TableView>
   </ScrollView>
  )
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
    photoUri: React.PropTypes.string,
  }).isRequired,
}
