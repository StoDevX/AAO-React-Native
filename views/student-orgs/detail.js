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
  cellTitles: {
    fontSize: 13,
    color: "red",
  },
  name: {
    textAlign: 'center',
    paddingTop: 10,
    color: 'black',
    fontSize: 32,
    fontWeight: '300',
  },
  desc: {
    flex: 1,
  },
  descText: {
    fontSize: 13,
    padding: 15,
    backgroundColor: c.white,
  },
})

export function StudentOrgsDetailView(props) {
  // let meetingTime = props.item.regularMeetingTime !== undefined
  //   ? 'Meeting Time: ' +
  //   : ''
  // let meetingLocation = props.item.regularMeetingTime !== undefined
  //   ? 'Location: ' +
  //   : ''

  let description = getText(parseHtml(props.item.description))

  return (
    <ScrollView>
     <Text style={styles.name}>{props.item.name}</Text>
     <TableView>
      <Section header='DETAILS'>
        <Cell contentContainerStyle={styles.cellTitles} cellStyle='RightDetail'
          title='Category'
          detail={props.item.categories[0]}
        />
        <Cell cellStyle='RightDetail'
          title='Members'
          detail={props.item.memberCount}
        />
        <Cell cellStyle='RightDetail'
          title='Meets'
          detail={props.item.regularMeetingTime}
        />
        <Cell cellStyle='RightDetail'
          title='Location'
          detail={props.item.regularMeetingLocation}
        />
      </Section>
      <Section header='DESCRIPTION'>
         <View style={styles.desc}>
          <Text style={styles.descText}>
            {description}
          </Text>
         </View>
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
  }).isRequired,
}
