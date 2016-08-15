/**
 * All About Olaf
 * Android Calendar page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'

import {TabLayout, Tab} from 'react-native-android-tablayout'
import NavigatorScreen from '../components/navigator-screen'
import OlevilleCalendarView from './olevilleCalendar'
import MasterCalendarView from './olevilleCalendar'
import tabs from './tabs'

export default class CalendarPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedTab: 0,
    }
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='Calendar'
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    let TabContents = tabs[this.state.selectedTab].content
    return (
      <View style={styles.container}>
        <TabLayout
          selectedTabIndicatorColor='darkslateblue'
          selectedTab={this.state.selectedTab}
          onTabSelected={e => {this.setState({selectedTab: e.nativeEvent.position})}}
        >
          {tabs.map(tab => <Tab key={tab.id} name={tab.title} />)}
        </TabLayout>
        {<TabContents />}
      </View>
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tab1: {
    width: 110,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab2: {
    width: 110,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
