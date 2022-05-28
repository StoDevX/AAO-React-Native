import {AppRegistry, LogBox} from 'react-native'
import App from './app'

LogBox.ignoreLogs([
	'Failed prop type: Invalid prop `containerTagName` of type `object` supplied to `ReactMarkdown`, expected `function`',
	'Failed prop type: Invalid prop `containerTagName` of type `string` supplied to `ReactMarkdown`, expected `function`.',
	"MaskedViewIOS has been extracted from react-native core and will be removed in a future release. It can now be installed and imported from '@react-native-community/masked-view' instead of 'react-native'. See https://github.com/react-native-community/react-native-masked-view",
	'componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-async-component-lifecycle-hooks for details.',
	'componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-async-component-lifecycle-hooks for details.',
])

AppRegistry.registerComponent('AllAboutOlaf', () => App)
