// @flow
/**
 * All About Olaf
 * iOS News page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Navigator,
} from 'react-native'

import {TabLayout, Tab} from 'react-native-android-tablayout'
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
    let tab = tabs[this.state.selectedTab]
    return (
      <View style={styles.container}>
        <TabLayout
          selectedTabIndicatorColor='darkslateblue'
          selectedTab={this.state.selectedTab}
          onTabSelected={e => this.setState({selectedTab: e.nativeEvent.position})}
        >
          {tabs.map(tab => <Tab key={tab.id} name={tab.title} />)}
        </TabLayout>
        {<tab.content url={tab.url} navigator={this.props.navigator} />}
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
