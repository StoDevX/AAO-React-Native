import * as React from 'react'
import {Image as RNImage, ImageSourcePropType, StyleSheet} from 'react-native'
import {changeIcon, getIcon, resetIcon} from 'react-native-change-icon'
import {
	Button,
	HStack,
	Image,
	RNHostView,
	Section,
	Spacer,
	Text,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	buttonStyle,
	contentShape,
	font,
	frame,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {icons as appIcons} from '../../../../images/icons'
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

type IconTypeEnum = 'default' | 'icon_type_old_main'

type Icon = {
	src: ImageSourcePropType
	title: string
	type: IconTypeEnum
}

export const icons: Array<Icon> = [
	{
		src: appIcons.windmill,
		title: 'Big Ole',
		type: 'default',
	},
	{
		src: appIcons.oldMain,
		title: 'Old Main',
		type: 'icon_type_old_main',
	},
]

export let IconSettingsView = (): React.ReactNode => {
	let [iconType, setIconType] = React.useState<IconTypeEnum>('default')

	let loadCurrentIcon = async () => {
		let name = await getIcon()
		setIconType((name === 'Default' ? 'default' : name) as IconTypeEnum)
	}

	React.useEffect(() => {
		loadCurrentIcon()
	}, [])

	let setIcon = async (iconName: string) => {
		if (iconName === 'default') {
			await resetIcon()
		} else {
			await changeIcon(iconName)
		}

		loadCurrentIcon()
	}

	return (
		<Section title="App Icon">
			{icons.map((icon) => (
				<IconCell
					key={icon.type}
					icon={icon}
					isSelected={iconType === icon.type}
					onPress={setIcon}
				/>
			))}
		</Section>
	)
}

type IconCellProps = {
	readonly icon: Icon
	readonly isSelected: boolean
	readonly onPress: (iconType: string) => void
}

let IconCell = (props: IconCellProps) => {
	let {isSelected, icon, onPress} = props

	let setIcon = () => {
		if (isSelected) {
			return
		}
		onPress(icon.type)
	}

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityIdentifier(
					`app-icon-cell-${icon.type}${isSelected ? '-selected' : ''}`,
				),
			]}
			onPress={setIcon}
		>
			<HStack
				modifiers={[contentShape(shapes.rectangle())]}
				spacing={ICON_LABEL_GAP}
			>
				<HStack modifiers={[frame({width: ICON_SIZE, height: ICON_SIZE})]}>
					<RNHostView matchContents={false}>
						<RNImage
							accessibilityIgnoresInvertColors={true}
							source={icon.src}
							style={styles.icon}
						/>
					</RNHostView>
				</HStack>
				<Text>{icon.title}</Text>
				<Spacer />
				{/* Settings.app draws the selected checkmark in the tint colour at
				    body size. A `font` with a text style rather than `size` so it
				    tracks Dynamic Type, which a fixed size does not. */}
				{isSelected && (
					<Image
						color={c.systemBlue}
						modifiers={[font({textStyle: 'body', weight: 'semibold'})]}
						systemName="checkmark"
					/>
				)}
			</HStack>
		</Button>
	)
}
