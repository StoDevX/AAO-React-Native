// @flow

import {Platform, Dimensions, NativeModules, DeviceInfo} from 'react-native'

// See https://mydevice.io/devices/ for device dimensions
const X_WIDTH = 375
const X_HEIGHT = 812
const PAD_WIDTH = 768
const PAD_HEIGHT = 1024

const {height: D_HEIGHT, width: D_WIDTH} = Dimensions.get('window')

const {PlatformConstants = {}} = NativeModules
const {minor = 0} = PlatformConstants.reactNativeVersion || {}

// from https://github.com/react-navigation/react-navigation/blob/master/src/views/SafeAreaView.js
export const iPhoneX = (() => {
	if (minor >= 50 && 'isIPhoneX_deprecated' in DeviceInfo) {
		return DeviceInfo.isIPhoneX_deprecated
	}

	return (
		Platform.OS === 'ios' &&
		((D_HEIGHT === X_HEIGHT && D_WIDTH === X_WIDTH) ||
			(D_HEIGHT === X_WIDTH && D_WIDTH === X_HEIGHT))
	)
})()

// from https://github.com/react-navigation/react-navigation/blob/master/src/views/SafeAreaView.js
export const iPad = (() => {
	if (Platform.OS !== 'ios' || iPhoneX) return false

	// if portrait and width is smaller than iPad width
	if (D_HEIGHT > D_WIDTH && D_WIDTH < PAD_WIDTH) {
		return false
	}

	// if landscape and height is smaller than iPad height
	if (D_WIDTH > D_HEIGHT && D_HEIGHT < PAD_HEIGHT) {
		return false
	}

	return true
})()
