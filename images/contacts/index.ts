import {Image, type ImageResolvedAssetSource} from 'react-native'

const boeHouse = Image.resolveAssetSource(
	require('./optimized/boe-house.jpg') as number,
)
const pauseKitchen = Image.resolveAssetSource(
	require('./optimized/pause-kitchen.jpg') as number,
)
const pubsafe = Image.resolveAssetSource(
	require('./optimized/pubsafe.jpg') as number,
)
const safeRide = Image.resolveAssetSource(
	require('./optimized/safe-ride.jpg') as number,
)
const sarn = Image.resolveAssetSource(require('./optimized/sarn.png') as number)

export const images = new Map<string, ImageResolvedAssetSource>([
	['boe-house', boeHouse],
	['pause-kitchen', pauseKitchen],
	['pubsafe', pubsafe],
	['safe-ride', safeRide],
	['sarn', sarn],
])
