// @flow

import {Alert, Clipboard} from 'react-native'
import {email} from 'react-native-communications'

export function sendEmail(args: {to: Array<string>, cc: Array<string>, bcc: Array<string>, subject: string, body: string}) {
  const {to, cc, bcc, subject, body} = args
  try {
    email(to, cc, bcc, subject, body)
  } catch (err) {
    const toString = to.join(', ')

    Alert.alert(
      "Apologies, we couldn't open an email client",
      `We were trying to email "${toString}".`,
      [
        {
          text: 'Darn',
          onPress: () => {},
        },
        {
          text: 'Copy addresses',
          onPress: () => Clipboard.setString(toString),
        },
      ],
    )
  }
}
