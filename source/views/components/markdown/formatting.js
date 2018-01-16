// @flow

import glamorous from 'glamorous-native'
import {SelectableText} from './selectable'
import {Platform, Text} from 'react-native'
import {iOSUIKit, material} from 'react-native-typography'

export const BaseText = glamorous(Text)({
  ...Platform.select({
    ios: iOSUIKit.bodyObject,
    android: material.body1Object,
  }),
})

export const Paragraph = glamorous(SelectableText)({
  marginVertical: 3,
  paddingRight: 4,
  ...Platform.select({
    ios: iOSUIKit.bodyObject,
    android: material.body1Object,
  }),
})

export const BlockQuote = glamorous(Paragraph)({
  marginHorizontal: 8,
  marginVertical: 5,
  fontStyle: 'italic',
  ...Platform.select({
    ios: iOSUIKit.calloutObject,
    android: material.captionObject,
  }),
})

export const Strong = glamorous.text({
  fontWeight: 'bold',
})

export const Emph = glamorous.text({
  fontStyle: 'italic',
})
