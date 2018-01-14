// @flow

import {Alert, Clipboard} from 'react-native'
import {phonecall} from 'react-native-communications'

export function callPhone(phoneNumber: string) {
  try {
    phonecall(phoneNumber, true)
  } catch (err) {
    Alert.alert(
      "Apologies, we couldn't call that number",
      `We were trying to call "${phoneNumber}".`,
      [
        {
          text: 'Darn',
          onPress: () => {},
        },
        {
          text: 'Copy number',
          onPress: () => Clipboard.setString(phoneNumber),
        },
      ],
    )
  }
}
