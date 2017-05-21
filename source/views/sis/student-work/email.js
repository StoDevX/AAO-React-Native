// @flow
import {email} from 'react-native-communications'

export function fixupEmailFormat(email: string) {
  if (!/@/.test(email)) {
    // No @ in address ... e.g. smith
    return `${email}@stolaf.edu`
  } else if (/@$/.test(email)) {
    // @ at end ... e.g. smith@
    return `${email}stolaf.edu`
  } else {
    // Defined address ... e.g. smith@stolaf.edu
    return email
  }
}

export function openEmail(to: string, subject: string) {
  email([to], null, null, subject, '')
}
