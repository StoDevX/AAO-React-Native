import * as React from 'react'
import {
	StyleSheet,
	ScrollView,
	Image,
	View,
	Text,
	TextProps,
	ViewProps,
} from 'react-native'
import {images as contactImages} from '../../../images/contacts'
import {Markdown} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import {callPhone} from '../../components/call-phone'
import {Button} from '@frogpond/button'
import {openUrl} from '@frogpond/open-url'
import {GH_NEW_ISSUE_URL} from '../../lib/constants'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RootStackParamList} from '../../navigation/types'
import {RouteProp, useRoute} from '@react-navigation/native'

const styles = StyleSheet.create({
	paragraph: {
		color: c.label,
		fontSize: 16,
	},
	image: {
		width: undefined,
		height: 100,
	},
	container: {
		paddingHorizontal: 18,
		paddingVertical: 6,
	},
	title: {
		color: c.label,
		fontSize: 36,
		textAlign: 'center',
		marginHorizontal: 18,
		marginVertical: 10,
	},
})

export const Title = (props: TextProps): JSX.Element => (
	<Text {...props} style={[styles.title, props.style]} />
)

export const Container = (props: ViewProps): JSX.Element => (
	<View {...props} style={[styles.container, props.style]} />
)

export const ContactsDetailView = (): JSX.Element => {
	let route =
		useRoute<RouteProp<RootStackParamList, typeof DetailNavigationKey>>()
	let {contact} = route.params

	let onPress = (): void => {
		let {phoneNumber, buttonText, buttonLink} = contact
		if (buttonLink) {
			openUrl(buttonLink)
		} else if (phoneNumber) {
			callPhone(phoneNumber, {title: buttonText})
		}
	}

	let headerImage =
		contact.image && contactImages.has(contact.image)
			? contactImages.get(contact.image)
			: null

	return (
		<ScrollView>
			{headerImage ? (
				<Image resizeMode="cover" source={headerImage} style={styles.image} />
			) : null}
			<Container>
				<Title selectable={true}>{contact.title}</Title>

				<Markdown
					source={contact.text}
					styles={{Paragraph: styles.paragraph}}
				/>

				<Button onPress={onPress} title={contact.buttonText} />

				<ListFooter
					href={GH_NEW_ISSUE_URL}
					title="Collected by the humans of All About Olaf"
				/>
			</Container>
		</ScrollView>
	)
}

export const DetailNavigationKey = 'ContactsDetail'

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof DetailNavigationKey>
}): NativeStackNavigationOptions => {
	let {title} = props.route.params.contact
	return {
		title: title,
	}
}
