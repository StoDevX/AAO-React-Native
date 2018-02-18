// @flow
import React, {Component} from 'react'
import {View, StyleSheet, Dimensions} from 'react-native'
import * as c from '../../../components/colors'
import {PropTypes} from 'prop-types'
import {Viewport} from '../../../components/viewport'

export default class Floor extends Component {
	render() {
		return (
			<Viewport
				render={({width, height}) => (
					<View
						style={[
							styles.floorContainer,
							{height: this.props.height, width: width},
						]}
					/>
				)}
			/>
		)
	}
}

const styles = StyleSheet.create({
	floorContainer: {
		backgroundColor: c.olevilleGold,
		position: 'absolute',
		width: Dimensions.get('window').width,
		bottom: 0,
	},
})

Floor.defaultProps = {
	heght: 10,
}

Floor.propTypes = {
	height: PropTypes.number,
}
