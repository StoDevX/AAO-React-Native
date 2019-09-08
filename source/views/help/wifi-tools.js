// @flow

import deviceInfo from 'react-native-device-info'
import networkInfo from 'react-native-network-info'
import {Platform} from 'react-native'
import RNLocation from 'react-native-location'
import pkg from '../../../package.json'

export const getIpAddress = (): Promise<?string> =>
	new Promise(resolve => {
		try {
			networkInfo.getIPAddress(resolve)
		} catch (err) {
			resolve(null)
		}
	})

export const getPosition = async (): Promise<null|Object> => {
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
					message: 'We use your location to report your current location for WiFi reporting',
					buttonPositive: 'OK',
					buttonNegative: 'Cancel',
				},
			},
		})
	}

	return RNLocation.getLatestLocation({timeout: 1500})
}

export const collectData = async () => ({
	id: deviceInfo.getUniqueID(),
	brand: deviceInfo.getBrand(),
	model: deviceInfo.getModel(),
	deviceKind: deviceInfo.getDeviceId(),
	os: deviceInfo.getSystemName(),
	osVersion: deviceInfo.getSystemVersion(),
	appVersion: deviceInfo.getReadableVersion(),
	jsVersion: pkg.version,
	ua: deviceInfo.getUserAgent(),
	ip: await getIpAddress(),
	dateRecorded: new Date().toJSON(),
})

export const reportToServer = (url: string, data: Object) =>
	fetch(url, {method: 'POST', body: JSON.stringify(data)})
