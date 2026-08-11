import * as React from 'react'
import {Image as RNImage, ImageSourcePropType, StyleSheet} from 'react-native'
import {changeIcon, getIcon, resetIcon} from 'react-native-change-icon'
import {HStack, Picker, RNHostView, Section, Text} from '@expo/ui/swift-ui'
import {
	contentShape,
	frame,
	pickerStyle,
	shapes,
	tag,
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

type IconTypeEnum = 'icon_type_big_ole' | 'icon_type_old_main'

type Icon = {
	src: ImageSourcePropType
	title: string
	type: IconTypeEnum
}

export const icons: Array<Icon> = [
	{src: appIcons.windmill, title: 'Big Ole', type: 'icon_type_big_ole'},
	{src: appIcons.oldMain, title: 'Old Main', type: 'icon_type_old_main'},
]

export let IconSettingsView = (): React.ReactNode => {
	let [iconType, setIconType] =
		React.useState<IconTypeEnum>('icon_type_big_ole')

	let loadCurrentIcon = async () => {
		let name = await getIcon()
		setIconType(
			(name === 'Default' ? 'icon_type_big_ole' : name) as IconTypeEnum,
		)
	}

	React.useEffect(() => {
		loadCurrentIcon()
	}, [])

	let setIcon = async (iconName: string) => {
		if (iconName === 'icon_type_big_ole') {
			await resetIcon()
		} else {
			await changeIcon(iconName)
		}

		loadCurrentIcon()
	}

	return (
		<Section title="App Icon">
			<Picker<IconTypeEnum>
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

	return (
		<HStack
			modifiers={[tag(icon.type), contentShape(shapes.rectangle())]}
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
		</HStack>
	)
}
