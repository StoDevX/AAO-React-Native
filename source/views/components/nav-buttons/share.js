// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../touchable'
import {rightButtonStyles as styles} from './styles'

type Props = {
	onPress: () => any,
}

export class ShareButton extends React.PureComponent<Props> {
	render() {
		return (
			<Touchable
				highlight={false}
				onPress={this.props.onPress}
				style={styles.button}
			>
				{Platform.OS === 'ios' ? (
					<Icon name="ios-share-outline" style={styles.icon} />
				) : (
					<Icon name="md-share" style={styles.icon} />
				)}
			</Touchable>
		)
	}
}
