import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Markdown} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import glamorous from 'glamorous-native'
import {Button} from '@frogpond/button'
import {openUrl} from '@frogpond/open-url'
import {GH_NEW_ISSUE_URL} from '../../../lib/constants'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const Title = glamorous.text({
	fontSize: 36,
	textAlign: 'center',
	marginHorizontal: 18,
	marginVertical: 10,
})

const Container = glamorous.scrollView({
	paddingHorizontal: 18,
	paddingVertical: 6,
})

const styles = StyleSheet.create({
	paragraph: {
		fontSize: 16,
	},
})

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, 'OtherModesDetail'>
}): NativeStackNavigationOptions => {
	let {name} = props.route.params.mode
	return {
		title: name,
	}
}

export function OtherModesDetailView(): JSX.Element {
	let route = useRoute<RouteProp<RootStackParamList, 'OtherModesDetail'>>()
	let {mode} = route.params

	return (
		<Container>
			<Title selectable={true}>{mode.name}</Title>

			<Markdown
				source={mode.description}
				styles={{Paragraph: styles.paragraph}}
			/>

			<Button onPress={() => openUrl(mode.url)} title="More Info" />

			<ListFooter
				href={GH_NEW_ISSUE_URL}
				title="Collected by the humans of All About Olaf"
			/>
		</Container>
	)
}
