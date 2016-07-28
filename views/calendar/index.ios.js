/**
 * All About Olaf
 * iOS Calendar page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  TabBarIOS,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import OlevilleCalendarView from './olevilleCalendar'
import MasterCalendarView from './olevilleCalendar'
import tabs from './tabs'

export default class MenusPage extends React.Component {
  constructor() {
    super()
    this.state = {
      isConnected: true,
      selectedTab: tabs[0].id,
    }
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="Calendar"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <TabBarIOS
          tintColor="white"
          barTintColor="darkslateblue"
        >
          {tabs.map(tab =>
            <TabBarIOS.Item
              key={tab.id}
              icon={tab.icon}
              title={tab.title}
              selected={this.state.selectedTab === tab.id}
              onPress={() => {this.setState({selectedTab: tab.id})}}
            >
              <tab.content />
            </TabBarIOS.Item>)}
        </TabBarIOS>
      </View>
    )
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
