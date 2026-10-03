import * as React from 'react'
import {Image as RNImage, StyleSheet, useColorScheme} from 'react-native'
import {changeIcon, getIcon, resetIcon} from 'react-native-change-icon'
import {HStack, Picker, RNHostView, Section, Text} from '@expo/ui/swift-ui'
import {contentShape, frame, pickerStyle, shapes, tag} from '@expo/ui/swift-ui/modifiers'
import {DEFAULT_ICON, type AppIconName, iconFor, previewsFor} from '../../../../images/icons'
import * as c from '@frogpond/colors'

/// Measured off a Settings.app screenshot on an iPhone 14 Pro (1179x2556,
/// @3x): the tile is 84px square with a ~20px corner, and the corner profile
/// fits a radius of 0.238 of the side -- Apple's icon squircle ratio.
const ICON_SIZE = 28
const ICON_RADIUS = 6.5
/// Settings.app leaves 17pt between the tile and the label.
const ICON_LABEL_GAP = 17

const styles = StyleSheet.create({
	icon: {
		width: ICON_SIZE,
		height: ICON_SIZE,
		borderColor: c.separator,
		borderRadius: ICON_RADIUS,
		borderWidth: StyleSheet.hairlineWidth,
	},
})

type Icon = {
	title: string
	type: AppIconName
}

export const icons: Array<Icon> = [
	{title: 'Big Ole', type: 'windmill'},
	{title: 'Old Main', type: 'sunset-behind-main'},
	{title: 'Old Main (Hill)', type: 'old-main-hill'},
	{title: 'Old Main (CRT)', type: 'old-main-crt'},
	{title: 'Windmill (Day)', type: 'windmill-day'},
	{title: 'Windmill (Night)', type: 'windmill-night'},
	{title: 'Windmill (Dawn)', type: 'windmill-dawn'},
	{title: 'Windmill (Storm)', type: 'windmill-storm'},
	{title: 'Windmill (Golden Hour)', type: 'windmill-golden-hour'},
	{title: 'Windmill (Aurora)', type: 'windmill-aurora'},
	{title: 'Windmill (Fog)', type: 'windmill-fog'},
	{title: 'Windmill (Snow)', type: 'windmill-snow'},
	{title: 'Windmill (Stars)', type: 'windmill-stars'},
	{title: 'Constellation', type: 'constellation'},
]

export let IconSettingsView = (): React.ReactNode => {
	let [iconType, setIconType] = React.useState<AppIconName>(DEFAULT_ICON)

	let loadCurrentIcon = async () => {
		setIconType(iconFor(await getIcon()))
	}

	React.useEffect(() => {
		// Reads the icon the system currently has set, which is exactly the
		// external-system case an effect is for. The rule counts this as a
		// synchronous setState, but `loadCurrentIcon` awaits `getIcon()` first,
		// so nothing is set until a later microtask.
		// oxlint-disable-next-line react/set-state-in-effect
		loadCurrentIcon()
	}, [])

	let setIcon = async (iconName: AppIconName) => {
		if (iconName === DEFAULT_ICON) {
			await resetIcon()
		} else {
			await changeIcon(iconName)
		}

		loadCurrentIcon()
	}

	return (
		<Section title="App Icon">
			<Picker<AppIconName>
				modifiers={[pickerStyle('inline')]}
				onSelectionChange={(value) => setIcon(value)}
				selection={iconType}
				testID="app-icon-picker"
			>
				{icons.map((icon) => (
					<IconCell key={icon.type} icon={icon} />
				))}
			</Picker>
		</Section>
	)
}

type IconCellProps = {
	readonly icon: Icon
}

let IconCell = (props: IconCellProps) => {
	let {icon} = props
	let scheme = useColorScheme()

	return (
		<HStack modifiers={[tag(icon.type), contentShape(shapes.rectangle())]} spacing={ICON_LABEL_GAP}>
			<HStack modifiers={[frame({width: ICON_SIZE, height: ICON_SIZE})]}>
				<RNHostView matchContents={false}>
					<RNImage
						accessibilityIgnoresInvertColors={true}
						source={previewsFor(icon.type, scheme).icon}
						style={styles.icon}
					/>
				</RNHostView>
			</HStack>
			<Text>{icon.title}</Text>
		</HStack>
	)
}
