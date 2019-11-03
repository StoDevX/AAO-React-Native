// @flow

import deviceInfo from 'react-native-device-info'
import RNLocation from 'react-native-location'
import pkg from '../../../package.json'

export const getPosition = async (): Promise<null | Object> => {
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

export async function collectData() {
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
		jsVersion: pkg.version,
		dateRecorded: new Date().toJSON(),
	}
}

export const reportToServer = (url: string, data: Object) =>
	fetch(url, {method: 'POST', body: JSON.stringify(data)})
