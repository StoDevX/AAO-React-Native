/**
 * All About Olaf
 * iOS News page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  TabBarIOS,
  Navigator,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import tabs from './tabs'

export default class NewsView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.instanceOf(Navigator),
  }

  state = {
    selectedTab: tabs[0].id,
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <TabBarIOS
          tintColor='white'
          barTintColor='darkslateblue'
        >
          {tabs.map(tab =>
            <TabBarIOS.Item
              key={tab.id}
              icon={tab.icon}
              title={tab.title}
              selected={this.state.selectedTab === tab.id}
              onPress={() => this.setState({selectedTab: tab.id})}
            >
              <tab.content
                navigator={this.props.navigator}
                url={tab.url}
              />
            </TabBarIOS.Item>)}
        </TabBarIOS>
      </View>
    )
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='News'
      renderScene={this.renderScene.bind(this)}
    />
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
