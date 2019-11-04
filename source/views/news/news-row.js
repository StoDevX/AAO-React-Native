// @flow

import * as React from 'react'
import {StyleSheet, Image, Alert} from 'react-native'
import {Column, Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'
import type {StoryType} from './types'

type Props = {
	onPress: string => any,
	story: StoryType,
	thumbnail: false | number,
}

export class NewsRow extends React.PureComponent<Props> {
	_onPress = () => {
		if (!this.props.story.link) {
			Alert.alert('There is nowhere to go for this story')
			return
		}
		this.props.onPress(this.props.story.link)
	}

	render() {
		let {story} = this.props
		let thumb =
			this.props.thumbnail !== false
				? story.featuredImage
					? {uri: story.featuredImage}
					: this.props.thumbnail
				: null

		return (
			<ListRow arrowPosition="top" onPress={this._onPress}>
				<Row alignItems="center">
					{thumb !== null ? (
						<Image
							accessibilityIgnoresInvertColors={true}
							source={thumb}
							style={styles.image}
						/>
					) : null}
					<Column flex={1}>
						<Title lines={2}>{story.title}</Title>
						<Detail lines={3}>{story.excerpt}</Detail>
					</Column>
				</Row>
			</ListRow>
		)
	}
}

const styles = StyleSheet.create({
	image: {
		borderRadius: 5,
		marginRight: 15,
		height: 70,
		width: 70,
	},
})
