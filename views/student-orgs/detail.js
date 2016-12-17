import React from 'react'
import {ScrollView, Text, View, StyleSheet} from 'react-native'

import {Cell, CustomCell, Section, TableView} from 'react-native-tableview-simple'
import { getText, parseHtml } from '../../lib/html'
import * as c from '../components/colors'

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

export function StudentOrgsDetailView(props) {
  let orgName = props.item.name !== undefined
    ? getText(parseHtml(props.item.name))
    : 'Name not listed'
  let orgCategory = props.item.categories[0] !== undefined
    ? getText(parseHtml(props.item.categories[0]))
    : 'Category not listed'
  let orgMeetingTime = props.item.regularMeetingTime !== undefined
    ? getText(parseHtml(props.item.regularMeetingTime))
    : 'Meeting time not listed'
  let orgMeetingLocation = props.item.regularMeetingLocation !== undefined
    ? getText(parseHtml(props.item.regularMeetingLocation))
    : 'Meeting location not listed'
  let orgContact = props.item.contactName !== undefined
    ? getText(parseHtml(props.item.contactName))
    : 'Contact not listed'
  let orgDescription = props.item.description !== undefined
    ? getText(parseHtml(props.item.description))
    : 'Description not listed'

 // We should not show the member numbers
 // It is inaccurate (more are involved than sign-up online)
 // It might discourage people from joining large/small groups

 // <Section header='MEMBERS'>
 //   <Cell cellStyle='RightDetail'
 //     title={props.item.memberCount}
 //   />
 // </Section>

  return (
    <ScrollView>
     <Text style={styles.name}>{orgName}</Text>
     <TableView>
       <Section header='CATEGORY'>
         <Cell cellStyle='Basic' title={orgCategory} />
       </Section>
       <Section header='MEETINGS'>
        <Cell cellStyle='Subtitle' title={orgMeetingTime} detail={orgMeetingLocation} />
       </Section>
       <Section header='CONTACT'>
        <Cell cellStyle='Basic' title={orgContact} />
      </Section>
      <Section header='DESCRIPTION'>
        <Text style={styles.description}>{orgDescription}</Text>
      </Section>
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
  }).isRequired,
}
