import * as React from 'react'
import {
	StyleSheet,
	Button,
	Platform,
	View,
	Text,
	TouchableOpacity,
} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import NetworkLogger, {getBackHandler} from 'react-native-network-logger'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import * as c from '@frogpond/colors'

export const NetworkLoggerView = (props) => {
	const goBack = () => setUnmountNetworkLogger(true)
	const [unmountNetworkLogger, setUnmountNetworkLogger] = React.useState(false)
	const backHandler = getBackHandler(goBack)

	const remountButton = (
		<View>
			<Button
				title={'Re-open the network logger'}
				onPress={() => setUnmountNetworkLogger(false)}
			>
				Re-open network logger
			</Button>
		</View>
	)

	return (
		<>
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.navButton}
					onPress={backHandler}
					hitSlop={styles.hitSlop}
				>
					<Text style={styles.backButtonText}>{'‹'}</Text>
				</TouchableOpacity>

				<Text style={styles.title} accessibilityRole="header">
					react-native-network-logger
				</Text>

				<View style={styles.navButton} />
			</View>

			{(unmountNetworkLogger && remountButton) || <NetworkLogger />}
		</>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Network Logger',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
	presentation: 'modal',
	gestureEnabled: false,
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: Platform.OS === 'android' ? 25 : 0,
	},
	header: {
		flexDirection: 'row',
	},
	navButton: {
		flex: 1,
	},
	hitSlop: {
		top: 20,
		left: 20,
		bottom: 20,
		right: 20,
	},
	backButtonText: {
		color: c.black,
		paddingHorizontal: 20,
		fontSize: 30,
		fontWeight: 'bold',
	},
	title: {
		flex: 5,
		color: c.black,
		textAlign: 'center',
		padding: 10,
		fontSize: 18,
		fontWeight: 'bold',
	},
})
