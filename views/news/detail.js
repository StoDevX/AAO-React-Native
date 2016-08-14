import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import * as c from '../components/colors'

let Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()

export default class NewsDetailView extends React.Component {

  constructor() {
    super()
    this.state = {
      dataSource: null,
    }
  }

  render() {
    return (
      <View style={[styles.container]}>
       </View>
      )
  }
}

const styles = StyleSheet.create({
  container: {
    marginLeft : 10,
    marginRight : 10,
    flex: 1,
    flexDirection : 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  newsPic: {
    width: 90,
    height: 60,
    margin: 10,
    marginLeft: 0,
  },
  newsTitle: {
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  newsStory: {
    color: c.iosText,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 6,
    fontSize: 13,
    textAlign: 'left',
  },
})

