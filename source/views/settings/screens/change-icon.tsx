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
	frame,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {icons as appIcons} from '../../../../images/icons'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	icon: {
		width: 16,
		height: 16,
		borderColor: c.label,
		borderRadius: 5,
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
		<Section title="APP ICON">
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
			<HStack modifiers={[contentShape(shapes.rectangle())]} spacing={12}>
				<HStack modifiers={[frame({width: 16, height: 16})]}>
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
				{isSelected && <Image size={16} systemName="checkmark" />}
			</HStack>
		</Button>
	)
}
