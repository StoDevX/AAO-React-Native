import * as React from 'react'
import {Modal} from 'react-native'
import {RNHostView} from '@expo/ui/swift-ui'

import {ZoomImageViewer} from '../../../components/zoom-image-viewer'

type Props = {
	uri: string
	label: string
	visible: boolean
	onClose: () => void
}

/**
 * A building's photo full screen, over the map's sheet.
 *
 * A React Native `Modal` inside the card, because the map screen is already
 * presenting the sheet: a pushed full-screen route dismisses the sheet, and a
 * `Modal` on the map screen never appears. Its host takes a new key on every
 * open, because a host that stays mounted presents its `Modal` only once.
 */
export function PhotoViewerModal({uri, label, visible, onClose}: Props): React.ReactNode {
	let [opens, setOpens] = React.useState(0)
	let [wasVisible, setWasVisible] = React.useState(visible)
	if (visible !== wasVisible) {
		setWasVisible(visible)
		if (visible) {
			setOpens((count) => count + 1)
		}
	}

	return (
		<RNHostView key={opens} matchContents={true}>
			<Modal
				animationType="fade"
				onRequestClose={onClose}
				presentationStyle="fullScreen"
				visible={visible}
			>
				<ZoomImageViewer
					closeTestID="map-photo-viewer-close"
					image={{uri, accessibilityLabel: label, testID: 'map-photo-viewer-image'}}
					onClose={onClose}
				/>
			</Modal>
		</RNHostView>
	)
}
