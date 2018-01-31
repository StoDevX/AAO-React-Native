// @flow

import deviceInfo from 'react-native-device-info'
import networkInfo from 'react-native-network-info'
import pkg from '../../../package.json'

export const getIpAddress = (): Promise<?string> =>
	new Promise(resolve => {
		try {
			networkInfo.getIPAddress(resolve)
		} catch (err) {
			resolve(null)
		}
	})

export const getPosition = (): Promise<Object> =>
	new Promise(resolve => {
		navigator.geolocation.getCurrentPosition(resolve, () => resolve({}))
	})

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
