import * as React from 'react'

import {trackedOpenUrl} from '@frogpond/open-url'
import {DisclosureRow} from '../../../components/rows'
import {streamDetailLines, streamTitle} from './lib'
import type {StreamType} from './types'

/// The thumbnails these feeds serve are 16:9-ish; this is the size the row
/// drew them at before, kept so the list's rhythm is unchanged.
const THUMBNAIL_WIDTH = 70
const THUMBNAIL_HEIGHT = 40

type Props = {stream: StreamType}

export const StreamRow = ({stream}: Props): React.ReactNode => (
	<DisclosureRow
		detail={streamDetailLines(stream)}
		image={
			stream.thumb
				? {uri: stream.thumb, width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT}
				: undefined
		}
		onPress={() => trackedOpenUrl({url: stream.player, id: 'StreamingMedia_StreamView'})}
		title={streamTitle(stream)}
		titleLines={2}
	/>
)
