import {ImageRequireSource} from 'react-native'

declare module '*.jpg' {
	const content: ImageRequireSource
	export default content
}

declare module '*.png' {
	const content: ImageRequireSource
	export default content
}
