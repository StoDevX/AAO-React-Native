// @flow
import React from 'react'
import {ScrollView, Image, StyleSheet} from 'react-native'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {Section, Cell} from '@frogpond/tableview'
import {icons as appIcons} from '../../../../images/icons'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	icon: {
		width: 16,
		height: 16,
		borderColor: c.black,
		borderRadius: 5,
		borderWidth: StyleSheet.hairlineWidth,
	},
})

type IconTypeEnum = 'default' | 'icon_type_windmill'

type Icon = {
	src: any,
	title: string,
	type: IconTypeEnum,
}

export const icons: Array<Icon> = [
	{
		src: appIcons.oldMain,
		title: 'Old Main',
		type: 'default',
	},
	{
		src: appIcons.windmill,
		title: 'Wind Turbine (Big Ole)',
		type: 'icon_type_windmill',
	},
]

type Props = {}

type State = {
	iconType: ?string,
}

export class IconSettingsView extends React.Component<Props, State> {
	static navigationOptions = {
		title: 'App Icon',
	}

	state = {
		iconType: null,
	}

	componentDidMount() {
		this.getIcon()
	}

	setIcon = async (iconType: string) => {
		if (iconType === 'default') {
			await Icons.reset()
		} else {
			await Icons.setIconName(iconType)
		}

		this.getIcon()
	}

	getIcon = async () => {
		const name = await Icons.getIconName()
		this.setState(() => ({iconType: name}))
	}

	render() {
		const selectedIcon = this.state.iconType
		return (
			<ScrollView>
				<Section header="CHANGE YOUR APP ICON" separatorInsetLeft={58}>
					{icons.map(icon => (
						<IconCell
							key={icon.type}
							icon={icon}
							isSelected={selectedIcon === icon.type}
							onPress={this.setIcon}
						/>
					))}
				</Section>
			</ScrollView>
		)
	}
}

type IconCellProps = {|
	+icon: Icon,
	+isSelected: boolean,
	+onPress: string => any,
|}

class IconCell extends React.Component<IconCellProps> {
	setIcon = () => {
		if (this.props.isSelected) {
			return
		}
		this.props.onPress(this.props.icon.type)
	}

	render() {
		const {isSelected, icon} = this.props
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
				onPress={this.setIcon}
				title={icon.title}
			/>
		)
	}
}
