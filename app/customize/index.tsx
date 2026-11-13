import * as React from 'react'
import {Platform, StyleSheet, useColorScheme} from 'react-native'
import {Form, Host, Toggle} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Stack, useFocusEffect, useRouter} from 'expo-router'
import * as c from '@frogpond/colors'
import {SheetSection} from '@frogpond/sheet-section'

import {previewFor} from '../../images/icons'
import {MenuPickerRow} from '../../source/components/menu-picker-row'
import {DisclosureRow, NavigationRow} from '../../source/components/rows'
import {SheetCloseButton} from '../../source/components/sheet-close-button'
import {useCampusSection} from '../../source/features/campus/store'
import {type LinkTarget, useOpenLinksIn} from '../../source/features/customize/open-links-in'
import {
	type HomeLayout,
	type HomeTileStyle,
	useHomeLayoutStore,
	useHomeTileStyleStore,
} from '../../source/features/home/store'
import {useAppIcon} from '../../source/features/customize/use-app-icon'
import {useRadioPlayerSetting} from '../../source/features/customize/radio-player-setting'
import {QUICK_ACTIONS_TITLE} from '../../source/features/customize/quick-actions-title'
import {uiCase} from '../../source/lib/ui-case'

/// Where links open, and what the menu calls each: Android opens them in a
/// Custom Tab or the reader's own browser, which need not be Safari's
/// counterpart.
const LINK_TARGETS = [
	['app', Platform.OS === 'android' ? 'In app' : 'In App'],
	['safari', Platform.OS === 'android' ? 'Browser' : 'Safari'],
] as const satisfies ReadonlyArray<readonly [LinkTarget, string]>

/// How home can lay out its tiles, and what the menu calls each.
const HOME_LAYOUTS = [
	['tiled', 'Tiled'],
	['list', 'List'],
] as const satisfies ReadonlyArray<readonly [HomeLayout, string]>

/// How Android can draw home's tiles, and what the menu calls each. iOS draws
/// its gradient cards and offers no choice.
const HOME_TILE_STYLES = [
	['shapes', 'Shapes'],
	['cards', 'Cards'],
] as const satisfies ReadonlyArray<readonly [HomeTileStyle, string]>

/// Settings' own row-icon size, as `rows.tsx` draws a gradient icon.
const ROW_ICON_SIZE = 30

const styles = StyleSheet.create({
	// A sheet paints its own background; a Form left to the default shows glass.
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function CustomizePage(): React.ReactNode {
	let router = useRouter()
	let scheme = useColorScheme()
	let {current, reload} = useAppIcon()
	// The gallery pushed from here changes the icon, so read it again on return.
	useFocusEffect(
		React.useCallback(() => {
			void reload()
		}, [reload]),
	)
	let [linkTarget, setLinkTarget] = useOpenLinksIn()
	let [showRadio, setShowRadio] = useRadioPlayerSetting()
	let homeLayout = useHomeLayoutStore((state) => state.layout)
	let setHomeLayout = useHomeLayoutStore((state) => state.setLayout)
	let tileStyle = useHomeTileStyleStore((state) => state.layout)
	let setTileStyle = useHomeTileStyleStore((state) => state.setLayout)
	let appIcons = useCampusSection('appIcons')
	let quickActions = useCampusSection('quickActions')

	return (
		<>
			<Stack.Title>Customize</Stack.Title>
			<SheetCloseButton />
			<Host style={styles.host} modifiers={[accessibilityIdentifier('screen-customize')]}>
				<Form>
					{appIcons ? (
						<SheetSection>
							<DisclosureRow
								detail={[current.title]}
								identifier="app-icon-row"
								image={{
									source: previewFor(current.type, scheme),
									width: ROW_ICON_SIZE,
									height: ROW_ICON_SIZE,
								}}
								onPress={() => router.navigate('/customize/app-icon')}
								title={uiCase('App Icon')}
							/>
						</SheetSection>
					) : null}
					<SheetSection title="Browsing">
						<MenuPickerRow
							id="open-links-in"
							label={uiCase('Open Links')}
							onSelectionChange={setLinkTarget}
							options={LINK_TARGETS}
							selection={linkTarget}
						/>
					</SheetSection>
					{/* On Android the home screen is the launcher's, not this app's Home. */}
					<SheetSection title={Platform.OS === 'android' ? 'Home' : 'Home Screen'}>
						<MenuPickerRow
							id="home-layout"
							label="Layout"
							onSelectionChange={setHomeLayout}
							options={HOME_LAYOUTS}
							selection={homeLayout}
						/>
						{Platform.OS === 'android' && homeLayout === 'tiled' ? (
							<MenuPickerRow
								id="home-tile-style"
								label={uiCase('Tile Style')}
								onSelectionChange={setTileStyle}
								options={HOME_TILE_STYLES}
								selection={tileStyle}
							/>
						) : null}
						<Toggle
							isOn={showRadio}
							label={uiCase('Radio Player')}
							modifiers={[accessibilityIdentifier('show-radio-player')]}
							onIsOnChange={setShowRadio}
						/>
						{quickActions ? (
							<NavigationRow
								onPress={() => router.navigate('/customize/quick-actions')}
								title={QUICK_ACTIONS_TITLE}
							/>
						) : null}
					</SheetSection>
				</Form>
			</Host>
		</>
	)
}
