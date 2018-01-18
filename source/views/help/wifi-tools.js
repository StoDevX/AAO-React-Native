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

export const getPosition = (args: any = {}): Promise<Object> =>
	new Promise(resolve => {
		navigator.geolocation.getCurrentPosition(resolve, () => resolve({}), {
			...args,
			enableHighAccuracy: true,
			maximumAge: 1000 /*ms*/,
			timeout: 5000 /*ms*/,
		})
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

export const reportToServer = (data: Object) =>
	fetch(
		'https://www.stolaf.edu/apps/all-about-olaf/index.cfm?fuseaction=Submit',
		{method: 'POST', body: JSON.stringify(data)},
	)
