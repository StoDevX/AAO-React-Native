import deviceInfo from 'react-native-device-info'
import RNLocation from 'react-native-location'
import pkg from '../../../package.json'

import type {Location} from 'react-native-location'
import type {Report} from './wifi'

export const getPosition = async (): Promise<Location | null> => {
	RNLocation.configure({distanceFilter: 100})

	let hasPermission = await RNLocation.checkPermission({
		ios: 'whenInUse',
		android: {detail: 'fine'},
	})

	if (!hasPermission) {
		hasPermission = await RNLocation.requestPermission({
			ios: 'whenInUse',
			android: {
				detail: 'fine',
				rationale: {
					title: 'We need to access your location',
					message:
						'We use your location to report your current location for WiFi reporting',
					buttonPositive: 'OK',
					buttonNegative: 'Cancel',
				},
			},
		})
	}

	return RNLocation.getLatestLocation({timeout: 1500})
}

export type DeviceReport = {
	id: string
	brand: string
	model: string
	deviceKind: string
	os: string
	osVersion: string
	appVersion: string
	ua: string
	ip: string
	jsVersion: string
	dateRecorded: string
}

export async function collectData(): DeviceReport {
	let dateRecorded = new Date().toJSON()
	let jsVersion = pkg.version

	let [
		id,
		brand,
		model,
		deviceKind,
		os,
		osVersion,
		appVersion,
		ua,
		ip,
	] = await Promise.all([
		deviceInfo.getUniqueId(),
		deviceInfo.getBrand(),
		deviceInfo.getModel(),
		deviceInfo.getDeviceId(),
		deviceInfo.getSystemName(),
		deviceInfo.getSystemVersion(),
		deviceInfo.getReadableVersion(),
		deviceInfo.getUserAgent(),
		deviceInfo.getIpAddress(),
	])

	return {
		id,
		brand,
		model,
		deviceKind,
		os,
		osVersion,
		appVersion,
		ua,
		ip,
		jsVersion,
		dateRecorded,
	}
}

export const reportToServer = (url: string, data: Report) =>
	fetch(url, {method: 'POST', body: JSON.stringify(data)})
