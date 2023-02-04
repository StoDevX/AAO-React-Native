import {launchImageLibrary} from 'react-native-image-picker'

export const updateBackgroundImage = async (): Promise<string> => {
	let uri = ''

	try {
		const result = await launchImageLibrary({mediaType: 'photo'})
		uri = result.assets?.[0].uri ?? ''
	} catch (err) {
		console.error(err)
	}

	return uri
}
