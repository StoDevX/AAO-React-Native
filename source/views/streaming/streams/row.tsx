import * as React from 'react'
import {StyleSheet, Image} from 'react-native'

import {ListRow, Detail, Title} from '@frogpond/lists'
import {Column, Row} from '@frogpond/layout'
import {innerTextWithSpaces, parseHtml} from '@frogpond/html-lib'
import {trackedOpenUrl} from '@frogpond/open-url'
import moment from 'moment'
import type {StreamType} from './types'

const styles = StyleSheet.create({
	image: {
		marginRight: 12,
		height: 40,
		width: 70,
	},
})

function Name({item}: {item: StreamType}) {
	let title = innerTextWithSpaces(parseHtml(item.title))
	return title ? <Title>{title}</Title> : null
}

function Info({item}: {item: StreamType}) {
	let detail = innerTextWithSpaces(
		parseHtml(item.subtitle || item.performer || ''),
	)
	return detail ? <Detail>{detail}</Detail> : null
}

function Time({item}: {item: StreamType}) {
	let showTime = item.status !== 'archived'
	return showTime ? (
		<Detail>{moment(item.date).format('h:mm A – ddd, MMM. Do, YYYY')}</Detail>
	) : null
}

function Thumbnail({item}: {item: StreamType}) {
	return item.thumb ? (
		<Image
			accessibilityIgnoresInvertColors={true}
			source={{uri: item.thumb}}
			style={styles.image}
		/>
	) : null
}

interface Props {stream: StreamType}

export const StreamRow = (props: Props): React.JSX.Element => {
	let onPressStream = () => {
		let {stream} = props
		trackedOpenUrl({url: stream.player, id: 'StreamingMedia_StreamView'})
	}

	let {stream} = props

	return (
		<ListRow arrowPosition="center" onPress={onPressStream}>
			<Row alignItems="center">
				<Thumbnail item={stream} />
				<Column flex={1}>
					<Name item={stream} />
					<Info item={stream} />
					<Time item={stream} />
				</Column>
			</Row>
		</ListRow>
	)
}
