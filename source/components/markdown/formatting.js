// @flow

import glamorous from 'glamorous-native'
import {SelectableText} from './selectable'

export const Paragraph = glamorous(SelectableText)({
  marginVertical: 3,
})

export const BlockQuote = glamorous(Paragraph)({
  fontStyle: 'italic',
  marginLeft: 8,
})

export const Strong = glamorous.text({
  fontWeight: 'bold',
})

export const Emph = glamorous.text({
  fontStyle: 'italic',
})
