import {Image, ImageResolvedAssetSource} from 'react-native'

const alumniHall = Image.resolveAssetSource(
	require('./optimized/alumni-hall.jpg'),
)
const boe = Image.resolveAssetSource(require('./optimized/boe.jpg'))
const bookstore = Image.resolveAssetSource(require('./optimized/bookstore.jpg'))
const buntrock = Image.resolveAssetSource(require('./optimized/buntrock.jpg'))
const cage = Image.resolveAssetSource(require('./optimized/cage.jpg'))
const centerForArtsAndDance = Image.resolveAssetSource(
	require('./optimized/center-for-arts-and-dance.jpg'),
)
const christiansen = Image.resolveAssetSource(
	require('./optimized/christiansen.jpg'),
)
const convenience = Image.resolveAssetSource(
	require('./optimized/convenience.jpg'),
)
const disco = Image.resolveAssetSource(require('./optimized/disco.jpg'))
const hallOfMusic = Image.resolveAssetSource(
	require('./optimized/hall-of-music.jpg'),
)
const halvorson = Image.resolveAssetSource(require('./optimized/halvorson.jpg'))
const oldMain = Image.resolveAssetSource(require('./optimized/old-main.jpg'))
const pauseKitchen = Image.resolveAssetSource(
	require('./optimized/pause-kitchen.jpg'),
)
const print = Image.resolveAssetSource(require('./optimized/print.jpg'))
const postOffice = Image.resolveAssetSource(
	require('./optimized/post-office.jpg'),
)
const regentsHall = Image.resolveAssetSource(
	require('./optimized/regents-hall.jpg'),
)
const regentsMath = Image.resolveAssetSource(
	require('./optimized/regents-math.jpg'),
)
const rolvaagLibrary = Image.resolveAssetSource(
	require('./optimized/rolvaag-library.jpg'),
)
const skifterStudioa = Image.resolveAssetSource(
	require('./optimized/skifter-studioa.jpg'),
)
const skoglund = Image.resolveAssetSource(require('./optimized/skoglund.jpg'))
const stav = Image.resolveAssetSource(require('./optimized/stav.jpg'))
const theater = Image.resolveAssetSource(require('./optimized/theater.jpg'))
const tomPorter = Image.resolveAssetSource(
	require('./optimized/tom-porter.jpg'),
)
const tomson = Image.resolveAssetSource(require('./optimized/tomson.jpg'))
const wellness = Image.resolveAssetSource(require('./optimized/wellness.jpg'))

export const images = new Map<string, ImageResolvedAssetSource>([
	['alumni-hall', alumniHall],
	['boe', boe],
	['bookstore', bookstore],
	['buntrock', buntrock],
	['cage', cage],
	['center-for-arts-and-dance', centerForArtsAndDance],
	['christiansen', christiansen],
	['convenience', convenience],
	['disco', disco],
	['hall-of-music', hallOfMusic],
	['halvorson', halvorson],
	['old-main', oldMain],
	['pause-kitchen', pauseKitchen],
	['print', print],
	['post-office', postOffice],
	['regents-hall', regentsHall],
	['regents-math', regentsMath],
	['rolvaag-library', rolvaagLibrary],
	['skifter-studioa', skifterStudioa],
	['skoglund', skoglund],
	['stav', stav],
	['theater', theater],
	['tom-porter', tomPorter],
	['tomson', tomson],
	['wellness', wellness],
])
