import * as React from 'react'
import {Image, ImageSourcePropType, StyleSheet} from 'react-native'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {Cell, Section} from '@frogpond/tableview'
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

type IconTypeEnum = 'default' | 'icon_type_windmill'

type Icon = {
	src: ImageSourcePropType
	title: string
	type: IconTypeEnum
}

export const icons: Array<Icon> = [
	{
		src: appIcons.oldMain,
		title: 'Old Main',
		type: 'default',
	},
	{
		src: appIcons.windmill,
		title: 'Big Ole',
		type: 'icon_type_windmill',
	},
]

export let IconSettingsView = (): JSX.Element => {
	let [iconType, setIconType] = React.useState<IconTypeEnum>('default')

	React.useEffect(() => {
		getIcon()
	}, [])

	let setIcon = async (iconName: string) => {
		if (iconName === 'default') {
			await Icons.reset()
		} else {
			await Icons.setIconName(iconName)
		}

		getIcon()
	}

	let getIcon = async () => {
		let name = (await Icons.getIconName()) as IconTypeEnum
		setIconType(name)
	}

	return (
		<Section header="APP ICON" separatorInsetLeft={58}>
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
		<Cell
			key={icon.title}
			accessory={isSelected ? 'Checkmark' : undefined}
			cellStyle="RightDetail"
			disableImageResize={false}
			image={
				<Image
					accessibilityIgnoresInvertColors={true}
					source={icon.src}
					style={styles.icon}
				/>
			}
			onPress={setIcon}
			title={icon.title}
		/>
	)
}
