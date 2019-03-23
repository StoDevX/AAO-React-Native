// @flow
import * as React from 'react'
import {Platform, View} from 'react-native'
import filter from 'lodash/filter'
import {CIRCLE_API_BASE_URL} from '../../../lib/constants'
import {refreshApp} from '../../../lib/refresh'
import RNFS from 'react-native-fs'
import {
	setActiveBundle,
	registerBundle,
	unregisterBundle,
	reloadBundle,
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
		// currently working (if the circle build hasn't purged the artifacts yet)
		this.downloadFileFromCircleCI()

		// currently not working
		this.readAndSetNewBundle()
	}

	readAndSetNewBundle = () => {
		RNFS.readDir(platformBundlePath)
			.then(result => {
				return Promise.all(result)
			})
			.then(results => {
				return filter(results, file => file.name.endsWith('.jsbundle'))
			})
			.then(bundledFiles => {
				// const fileName = bundledFiles.name
				const name = 'downloaded_bundle.jsbundle'

				this.removeAndUnregisterOldBundle(name)
				this.bundleRegister('downloaded_bundle')
				this.bundleSetActive(name)
				this.bundleReload(name)

				refreshApp()
			})
			.catch(err => {
				console.log(err.message, err.code)
			})
	}

	downloadFileFromCircleCI = () => {
		RNFS.downloadFile({
			fromUrl: CIRCLE_CI_JS_BUNDLE_URI,
			toFile: `${platformBundlePath}/downloaded_bundle.jsbundle`,
		}).promise.then(result => {
			console.log(CIRCLE_CI_JS_BUNDLE_URI)
			console.log(result)
		})
	}

	/*
	 * Register a bundle in the documents directory of the app. This could be
	 * pre-packaged in your app, downloaded over http, etc. Paths are relative
	 * to your documents directory.
	 */
	bundleRegister = (filename: string) => {
		registerBundle(filename, filename)
	}

	/*
	 * Set the active bundle to the new name. This means that on the next load
	 * this bundle will be loaded instead of the default.
	 */
	bundleSetActive = (filename: string) => {
		setActiveBundle(filename)
	}

	/*
	 * In some circumstances (e.g. the user consents to an update) we want to
	 * force a bundle reload instead of waiting until the next app restart.
	 * Note that this will have to result in the destruction of the current
	 * RCTBridge and its recreation with the new bundle URL. It is therefore
	 * recommended to sync data and let actions complete before calling this.
	 */
	bundleReload = () => {
		reloadBundle()
	}

	removeAndUnregisterOldBundle = (filename: string) => {
		this.bundleUnregister('downloaded_bundle')
		this.deleteBundle(`${platformBundlePath}/${filename}`)
	}

	/*
	 * Unregister a bundle once you're done with it. Note that you will have to
	 * remove the file yourself.
	 */
	bundleUnregister = (filename: string) => {
		unregisterBundle(filename)
	}

	deleteBundle = (path: string) => {
		return RNFS.unlink(path)
			.then(() => {
				console.log('BUNDLE DELETED')
			})
			.catch(err => {
				console.log(err.message)
			})
	}

	render() {
		return <View />
	}
}
