import * as React from 'react'
import * as c from '@frogpond/colors'
import glamorous from 'glamorous-native'
import {Markdown} from '@frogpond/markdown'
import {text} from '../../../../docs/legal.json'

export let LegalView = (): JSX.Element => (
	<glamorous.ScrollView
		backgroundColor={c.white}
		contentInsetAdjustmentBehavior="automatic"
		paddingHorizontal={15}
	>
		<glamorous.View paddingVertical={15}>
			<Markdown source={text} />
		</glamorous.View>
	</glamorous.ScrollView>
)
