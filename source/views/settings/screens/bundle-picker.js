// @flow
import * as React from 'react'
import {View} from 'react-native'
import {fetch} from '@frogpond/fetch'
import {CIRCLE_API_BASE_URL} from '../../../lib/constants'
import {refreshApp} from '../../../lib/refresh'
import RNFS from 'react-native-fs'
import {
	setActiveBundle,
	registerBundle,
	reloadBundle,
	getBundles,
} from 'react-native-dynamic-bundle'
import {type TopLevelViewPropsType} from '../../types'

const CIRCLE_CI_TOKEN = ''
const CIRCLE_BUILD = '50413'
const CIRCLE_CI_JS_BUNDLE_URI = `${CIRCLE_API_BASE_URL}/${CIRCLE_BUILD}/artifacts?circle-token=${CIRCLE_CI_TOKEN}`

type Props = TopLevelViewPropsType

export class BundlePickerView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Bundle Picker',
	}

	componentDidMount() {
		this.updateBundle()
	}

	updateBundle = async () => {
		const circleResponse = await fetch(CIRCLE_CI_JS_BUNDLE_URI).json()

		await RNFS.downloadFile({
			fromUrl: circleResponse[0].url,
			toFile: `${RNFS.DocumentDirectoryPath}/test.bundle`,
		})

		registerBundle('test', 'test.bundle')
		setActiveBundle('test')

		const bundles = await getBundles()
		console.log(bundles)

		reloadBundle()
		refreshApp()
	}

	render() {
		return <View />
	}
}
