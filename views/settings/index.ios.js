/**
 * All About Olaf
 * iOS Settings page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
} from 'react-native'

import {
    Cell,
    CustomCell,
    Section,
    TableView
} from 'react-native-tableview-simple'

import NavigatorScreen from '../components/navigator-screen'
import Icon from 'react-native-vector-icons/Entypo'

export default class SettingsView extends React.Component {
  constructor(){
    super();
  }

render() {
  return <NavigatorScreen
      {...this.props}
      title="Settings"
      renderScene={this.renderScene.bind(this)}
    />
}

  renderScene() {
    return (
        <ScrollView contentContainerStyle={styles.stage}>
        <TableView>
            <Section header="ST. OLAF ACCOUNT">
                <CustomCell>
                    <Icon name="user" size={18} />
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        cellStyle="Basic"
                        autoCorrect={false}
                        autoCapitalize="none"
                        style={styles.customTextInput}
                        placeholder="username" />
                </CustomCell>

                <CustomCell>
                    <Icon name="lock" size={18} />
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        secureTextEntry={true}
                        autoCorrect={false}
                        autoCapitalize="none"
                        cellStyle="Basic"
                        style={styles.customTextInput}
                        placeholder="password" />
                </CustomCell>
            </Section>

            <Section header="SUPPORT">
                <Cell cellStyle="RightDetail"
                    title="Contact Us"
                    accessory="DisclosureIndicator"
                    onPress={() => {console.log('support pressed')}}/>
            </Section>

            <Section header="ODDS & ENDS">
                <Cell cellStyle="RightDetail"
                    title="Version"
                    detail="<get me from info.plist>"/>

                <Cell cellStyle="Basic"
                    title="Credits"
                    accessory="DisclosureIndicator"
                    onPress={() => {console.log('credits pressed')}}/>

                <Cell cellStyle="Basic"
                    title="Privacy Policy"
                    accessory="DisclosureIndicator"
                    onPress={() => {console.log('privacy policy pressed')}}/>

                <Cell cellStyle="Basic"
                    title="Legal"
                    accessory="DisclosureIndicator"
                    onPress={() => {console.log('legal pressed')}}/>
          </Section>
        </TableView>
      </ScrollView>
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
   stage: {
    backgroundColor: '#EFEFF4',
    paddingTop: 20,
    paddingBottom: 20,
  },
  label: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    marginRight: -100,
  },
  customTextInput: {
    flex: 1,
    color: '#C7C7CC',
  },
});

