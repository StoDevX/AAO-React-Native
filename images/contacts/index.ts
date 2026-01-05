import {Image, type ImageResolvedAssetSource} from 'react-native'

const boeHouse = Image.resolveAssetSource(require('./optimized/boe-house.jpg'))
const pauseKitchen = Image.resolveAssetSource(
	require('./optimized/pause-kitchen.jpg'),
)
const pubsafe = Image.resolveAssetSource(require('./optimized/pubsafe.jpg'))
const safeRide = Image.resolveAssetSource(require('./optimized/safe-ride.jpg'))
const sarn = Image.resolveAssetSource(require('./optimized/sarn.png'))

export const images = new Map<string, ImageResolvedAssetSource>([
	['boe-house', boeHouse],
	['pause-kitchen', pauseKitchen],
	['pubsafe', pubsafe],
	['safe-ride', safeRide],
	['sarn', sarn],
])
