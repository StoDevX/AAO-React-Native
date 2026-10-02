import * as React from 'react'
import {StyleSheet, View, Text, TouchableOpacity, useColorScheme} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import NetworkLogger, {getBackHandler} from 'react-native-network-logger'
import {SafeAreaView} from 'react-native-safe-area-context'
import * as c from '@frogpond/colors'
import {Stack} from 'expo-router'

export default function NetworkLoggerPage(): React.ReactNode {
	const goBack = () => setUnmountNetworkLogger(true)
	const [unmountNetworkLogger, setUnmountNetworkLogger] = React.useState(false)
	const backHandler = getBackHandler(goBack)

	const scheme = useColorScheme()
	const themeMode = scheme === 'dark' ? 'dark' : 'light'

	const remountButton = (
		<NoticeView
			action={{label: 'Re-open', onPress: () => setUnmountNetworkLogger(false)}}
			systemImage="network"
			title="Network Logger Closed"
		/>
	)

	return (
		<>
			<Stack.Screen options={{gestureEnabled: false}} />
			<Stack.Title>Network Logger</Stack.Title>

			<SafeAreaView edges={['left', 'right']} style={styles.screen}>
				<View style={styles.header}>
					<TouchableOpacity hitSlop={styles.hitSlop} onPress={backHandler} style={styles.navButton}>
						<Text style={styles.backButtonText}>‹</Text>
					</TouchableOpacity>

					<Text accessibilityRole="header" style={styles.title}>
						react-native-network-logger
					</Text>

					<View style={styles.navButton} />
				</View>

				{(unmountNetworkLogger && remountButton) || <NetworkLogger theme={themeMode} />}
			</SafeAreaView>
		</>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
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
		color: c.label,
		paddingHorizontal: 20,
		fontSize: 30,
		fontWeight: 'bold',
	},
	title: {
		flex: 5,
		color: c.label,
		textAlign: 'center',
		padding: 10,
		fontSize: 18,
		fontWeight: 'bold',
	},
})
