// This declaration must be inside the app code, so that Typescript merges
// it with the default react typings. If it is placed into a separate .d.ts
// file, Typescript will instead replace the default typings.
declare module 'react' {
	// source: https://fettblog.eu/typescript-react-generic-forward-refs/
	function forwardRef<T, P = object>(
		render: (props: P, ref: React.RefObject<T>) => React.ReactElement | null,
	): (props: P & React.RefAttributes<T>) => React.ReactElement | null
}

import {AppRegistry} from 'react-native'
import App from './app'

AppRegistry.registerComponent('AllAboutOlaf', () => App)
