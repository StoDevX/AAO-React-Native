import {callPhone} from '../../components/call-phone'
import {sendEmail} from '../../components/send-email'
import type {FABGroupAction} from 'react-native-paper'
import type {CampusLocation, DirectoryItem} from './types'

type FABActionType = Pick<FABGroupAction, 'icon' | 'label' | 'onPress'>

export const buildPhoneActions = (
	loc: CampusLocation,
	locationsCount: number,
): FABActionType => {
	return {
		icon: 'phone',
		label:
			locationsCount === 1 ? 'Call' : `Call ${loc.buildingabbr} ${loc.room}`,
		onPress: () => callPhone(loc.phone),
	}
}

export const buildEmailAction = (
	email: DirectoryItem['email'],
): FABActionType[] => {
	if (!email) return []

	return [
		{
			icon: 'email',
			label: 'Email',
			onPress: () => sendEmail({to: [email], subject: '', body: ''}),
		},
	]
}
