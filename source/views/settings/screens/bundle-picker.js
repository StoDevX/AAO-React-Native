// @flow
import * as React from 'react'
import {Platform, View} from 'react-native'
import {fetch} from '@frogpond/fetch'
import filter from 'lodash/filter'
import {CIRCLE_API_BASE_URL} from '../../../lib/constants'
import {refreshApp} from '../../../lib/refresh'
import RNFS from 'react-native-fs'
import {
	setActiveBundle,
	registerBundle,
	unregisterBundle,
	reloadBundle,
	getActiveBundle,
	getBundles,
} from 'react-native-dynamic-bundle'

const platformBundlePath =
	Platform.OS === 'ios' ? RNFS.MainBundlePath : RNFS.DocumentDirectoryPath

const CIRCLE_CI_TOKEN = ''
const CIRCLE_BUILD = '50413'
const CIRCLE_CI_JS_BUNDLE_URI = `${CIRCLE_API_BASE_URL}/${CIRCLE_BUILD}/artifacts?circle-token=${CIRCLE_CI_TOKEN}`

export class BundlePickerView extends React.Component {
	static navigationOptions = {
		title: 'Bundle Picker',
	}

	componentDidMount() {
		this.updateBundle()
	}

	updateBundle = async () => {
		const circleResponse = await fetch(CIRCLE_CI_JS_BUNDLE_URI).json()

		const result = await RNFS.downloadFile({
			fromUrl: circleResponse[0].url,
			toFile: `${platformBundlePath}/test.bundle`,
		})

		registerBundle('test', 'test.bundle')
		setActiveBundle('test')

		const bundles = await getBundles()
		const activeBundle = await getActiveBundle()

		console.log(bundles)
		console.log(activeBundle)

		reloadBundle()
		refreshApp()
	}

	render() {
		return <View />
	}
}
