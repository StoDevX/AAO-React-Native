import * as React from 'react'
import {Alert, StyleSheet, ScrollView, Image} from 'react-native'
import {images as contactImages} from '../../../images/contacts'
import {Markdown} from '@frogpond/markdown'
import {ListFooter} from '@frogpond/lists'
import glamorous from 'glamorous-native'
import {callPhone} from '../../components/call-phone'
import {Button} from '@frogpond/button'
import {openUrl} from '@frogpond/open-url'
import type {ContactType} from './types'
import {GH_NEW_ISSUE_URL} from '../../lib/constants'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/types'
import { RouteProp } from '@react-navigation/native'

const Title = glamorous.text({
	fontSize: 36,
	textAlign: 'center',
	marginHorizontal: 18,
	marginVertical: 10,
})

const Container = glamorous.view({
	paddingHorizontal: 18,
	paddingVertical: 6,
})

const styles = StyleSheet.create({
	paragraph: {
		fontSize: 16,
	},
	image: {
		width: null,
		height: 100,
	},
})

function formatNumber(phoneNumber: string) {
	let re = /(\d{3})-?(\d{3})-?(\d{4})/gu
	return phoneNumber.replace(re, '($1) $2-$3')
}

function promptCall(buttonText: string, phoneNumber: string) {
	Alert.alert(buttonText, formatNumber(phoneNumber), [
		{text: 'Cancel', onPress: () => {}},
		{text: 'Call', onPress: () => callPhone(phoneNumber, {prompt: false})},
	])
}

type Props = {navigation: {state: {params: {contact: ContactType}}}}

export class ContactsDetailView extends React.PureComponent<Props> {
	onPress = () => {
		let {phoneNumber, buttonText, buttonLink} =
			this.props.route.params.contact
		if (buttonLink) {
			openUrl(buttonLink)
		} else if (phoneNumber) {
			promptCall(buttonText, phoneNumber)
		}
	}

	render() {
		let contact = this.props.route.params.contact
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

					<Button onPress={this.onPress} title={contact.buttonText} />

					<ListFooter
						href={GH_NEW_ISSUE_URL}
						title="Collected by the humans of All About Olaf"
					/>
				</Container>
			</ScrollView>
		)
	}
}


export const NavigationKey = 'ContactsDetail'

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {contact} = props.route.params
	return {
		title: contact.title,
	}
}
