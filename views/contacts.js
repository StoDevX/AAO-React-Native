/**
 * All About Olaf
 * iOS Contact page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ListView,
} from 'react-native'

import Button from 'react-native-button'; // the button
import Communications from 'react-native-communications'; // the phone call functions
import {
  Card,
  CardImage,
  CardTitle,
  CardContent,
  CardAction,
} from 'react-native-card-view'; // this relies on the exoernal card library

import NavigatorScreen from './components/navigator-screen'
import ContactCard from './components/contactCard'

const numbers = [
  {title:'St. Olaf Public Safety',
   text:'24-Hour Public Safety Dispatch. Public safety is availiable 24 hours a day, most days of the year. Call public safety in many situations, but there is always the option of calling the police as well.',
   phoneNumber:'5077863666',
   buttonText:'Call Public Safety',
   imageURI:'../data/images/contacts/pubsafe.jpg'},

  {title:'Safe Ride',
   text:'Students concerned about their personal safety may contact Safe Ride to request a walking escort or vehicular transportation on campus and to areas immediately adjacent to the campus. This service was created for personal safety reasons only and will not transport groups of people or provide transportation to downtown locations. Safe Ride is available from 7:00 P.M. to 1:00 A.M. each day classes are in session.',
   phoneNumber:'5077863666',
   buttonText:'Request Safe Ride',
   imageURI:'http://oleville.com/tech/wp-content/uploads/sites/19/2016/07/pubsafecar.jpg'},

  {title:'SARN',
   text:'SARN, the Sexual Assault Resource Network, is a confidential resource availiable to all students. Calls to SARN will be picked up by a trained advocate to provide services to students struggling with issues of sexual and domestic violence.',
   phoneNumber:'5077863777',
   buttonText:'Call SARN',
   imageURI:'../data/images/contacts/pause.jpg'},

  {title:'The Pause Kitchen',
   text:'Place orders in The Pause Kitchen. The pause delivers anywhere on campus, or orders can be placed for pickup.',
   phoneNumber:'5077866969',
   buttonText:'Call The Pause',
   imageURI:'../data/images/contacts/pause.jpg'},
]

export default class ContactView extends React.Component {
  constructor() {
    super()
    let ds = new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    })
    this.state = {
      dataSource: ds.cloneWithRows(numbers)
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.title !== r2.title
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="Contact"
      renderScene={this.renderScene.bind(this)}
    />
  }

  renderScene() {
    return (
      <View style={styles.container}>
        <ListView
        renderRow={this._renderRow.bind(this)}
          dataSource={this.state.dataSource}
        />
      </View>
    )
  }

  _renderRow(data) {
    return (
      <ContactCard title={data.title} text={data.text} phoneNumber={data.phoneNumber} buttonText={data.buttonText} imageURI={data.imageURI}/>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {

  },
})
