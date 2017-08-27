// @flow

import glamorous from 'glamorous-native'
import {SelectableText} from './selectable'

export const Heading = glamorous(SelectableText)({
  marginTop: 8,
  marginBottom: 4,
  fontWeight: 'bold',
  fontSize: 16,
})
