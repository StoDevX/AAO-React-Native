import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import type {FABGroupAction} from 'react-native-paper'
import type {CampusLocation, DirectoryItem} from './types'

export const buildPhoneActions = (
	loc: CampusLocation,
	locationsCount: number,
): FABGroupAction => {
	return {
		icon: 'phone',
		label:
			locationsCount === 1 ? 'Call' : `Call ${loc.buildingabbr} ${loc.room}`,
		onPress: () => callPhone(loc.phone),
	}
}

export const buildEmailAction = (
	email: DirectoryItem['email'],
): FABGroupAction[] => {
	if (!email) return []

	return [
		{
			icon: 'email',
			label: 'Email',
			onPress: () => sendEmail({to: [email], subject: '', body: ''}),
		},
	]
}
