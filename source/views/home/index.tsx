import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, HStack, RNHostView, ScrollView, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	frame,
	padding,
} from '@expo/ui/swift-ui/modifiers'

import {AllViews} from '../views'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
import {partitionByIndex} from '../../lib/partition-by-index'
import {CELL_MARGIN, FILL_WIDTH, HomeScreenButton} from './button'
import {openUrl} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import {useIsDevMode} from '../../lib/use-is-dev-mode'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const styles = StyleSheet.create({
	banner: {
		marginHorizontal: CELL_MARGIN,
		marginTop: CELL_MARGIN,
		marginBottom: CELL_MARGIN / 2,
	},
	host: {
		flex: 1,
	},
})

function HomePage(): React.ReactNode {
	let navigation = useNavigation()
	let isDev = useIsDevMode()
	let allViews = AllViews().filter(
		(view) => !view.disabled && (isDev || !view.devOnly),
	)
	let columns = partitionByIndex(allViews)

	// SwiftUI owns the scrolling. Wrapping this in a React Native ScrollView
	// instead puts that scroll view between the touch and the SwiftUI buttons,
	// and the tiles stop responding reliably on device.
	return (
		<Host
			matchContents={false}
			modifiers={[accessibilityIdentifier('screen-homescreen')]}
			style={styles.host}
		>
			<ScrollView>
				<VStack
					modifiers={[
						padding({all: CELL_MARGIN}),
						frame({maxWidth: FILL_WIDTH}),
					]}
					spacing={CELL_MARGIN}
				>
					{/* The banner is still React Native, so it has to be hosted back
					    into SwiftUI to scroll with the rest of the content. */}
					<RNHostView matchContents={true}>
						<FaqBannerGroup style={styles.banner} target={FAQ_TARGETS.HOME} />
					</RNHostView>

					<HStack alignment="top" spacing={CELL_MARGIN}>
						{columns.map((contents, i) => (
							<VStack
								key={i}
								modifiers={[frame({maxWidth: FILL_WIDTH})]}
								spacing={CELL_MARGIN}
							>
								{contents.map((view) => (
									<HomeScreenButton
										key={view.type === 'view' ? view.view : view.title}
										onPress={() => {
											if (view.type === 'url') {
												return openUrl(view.url)
											} else if (view.type === 'view') {
												return navigation.navigate(view.view)
											} else {
												throw new Error(`unexpected view type ${view.type}`)
											}
										}}
										view={view}
									/>
								))}
							</VStack>
						))}
					</HStack>

					<UnofficialAppNotice />
				</VStack>
			</ScrollView>
		</Host>
	)
}

export {HomePage as View}

export const NavigationKey = 'Home'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'All About Olaf',
	headerRight: (props) => <OpenSettingsButton {...props} />,
}

export type NavigationParams = undefined
