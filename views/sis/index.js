/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {
  StyleSheet,
  View,
} from 'react-native'
import NavigatorScreen from '../components/navigator-screen'
import SISLoginSection from './login'

// let financials = 'https://www.stolaf.edu/sis/st-financials.cfm'
// let sis = 'https://www.stolaf.edu/sis/login.cfm'
// let olecard = 'https://www.stolaf.edu/apps/olecard/checkbalance/authenticate.cfm'

// import Frisbee from 'frisbee'
// const api = new Frisbee({
//   baseURI: 'https://www.stolaf.edu',
// })

// import buildFormData from './formdata'

// import {saveLoginCredentials, loadLoginCredentials, clearLoginCredentials} from './loginstuff'

// async function weeklyMealsRemaining() {
//   let {username, password} = await loadLoginCredentials()
//   let form = buildFormData({
//     username: username,
//     password: password,
//   })
//   let page = await api.post('/apps/olecard/checkbalance/authenticate.cfm', {body: form})
//   console.log(page)
//   return page
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default class SISView extends React.Component {
  componentWillMount() {

  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <SISLoginSection />
      </View>
    )
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='SIS'
      renderScene={this.renderScene.bind(this)}
    />
  }
}
