// @flow

import glamorous from 'glamorous-native'

export const Paragraph = glamorous.text({
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
