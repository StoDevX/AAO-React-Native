/**
 * All About Olaf
 * iOS News page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Text,
  TabBarIOS,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import tabs from './tabs'

export default class NewsView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedTab: tabs[0].id,
    }
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="News"
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
