// @flow

import glamorous from 'glamorous-native'
import * as c from '../components/colors'

export const Title = glamorous.text({
	fontWeight: '700',
	fontSize: 16,
	marginBottom: 10,
	textAlign: 'center',
})

export const Error = glamorous.view({
	backgroundColor: c.warning,
	padding: 10,
	borderRadius: 5,
	marginTop: 10,
	marginBottom: 0,
})

export const ErrorMessage = glamorous.text({
	fontSize: 14,
})
