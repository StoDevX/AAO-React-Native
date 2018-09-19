// @flow

import * as React from 'react'
import {AppRegistry, StyleSheet, View, Text, Switch} from 'react-native'

import * as c from '@frogpond/colors'

import EntypoIcon from 'react-native-vector-icons/Entypo'

import type {ViewType} from '../../views'

const ROW_HORIZONTAL_MARGIN = 15
const styles = StyleSheet.create({
	row: {
		flex: 1,

		flexDirection: 'row',
		alignItems: 'center',

		backgroundColor: c.white,

		marginHorizontal: ROW_HORIZONTAL_MARGIN,
	},
	icon: {
		paddingLeft: 10,
		paddingRight: 10,
		color: c.black,
	},
	text: {
		flex: 1,
		flexShrink: 0,
		fontSize: 18,
		color: c.black,
		marginRight: 10,
	},
})

const MenuIcon = ({icon, tint}: {icon: string, tint: string}) => (
	<EntypoIcon name={icon} size={32} style={[styles.icon, {color: tint}]} />
)

type Props = {
	active: boolean,
	data: ViewType,
	isEnabled: boolean,
	onToggle: string => any,
	width: number,
}

export class EditHomeRow extends React.Component<Props> {
	onToggleSwitch = () => {
        // todo: can only pass in primitives... implement this from list row?
		this.props.onToggle(this.props.data.view)
	}

	render() {
		const tint = this.props.data.gradient
			? this.props.data.gradient[0]
			: this.props.data.tint

		return (
			<View style={[styles.row, this._style]}>
				<MenuIcon icon={this.props.data.icon} tint={tint} />

				<Text style={[styles.text, {color: tint}]}>
					{this.props.data.title}
				</Text>

				<Switch
					onTintColor={tint}
					onValueChange={this.onToggleSwitch}
					value={this.props.data.isEnabled}
				/>
			</View>
		)
	}
}
