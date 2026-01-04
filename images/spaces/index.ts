import {Image, ImageResolvedAssetSource} from 'react-native'

const alumniHall = Image.resolveAssetSource(
	require('./optimized/alumni-hall.jpg') as number,
)
const boe = Image.resolveAssetSource(require('./optimized/boe.jpg') as number)
const bookstore = Image.resolveAssetSource(
	require('./optimized/bookstore.jpg') as number,
)
const buntrock = Image.resolveAssetSource(
	require('./optimized/buntrock.jpg') as number,
)
const cage = Image.resolveAssetSource(require('./optimized/cage.jpg') as number)
const centerForArtsAndDance = Image.resolveAssetSource(
	require('./optimized/center-for-arts-and-dance.jpg') as number,
)
const christiansen = Image.resolveAssetSource(
	require('./optimized/christiansen.jpg') as number,
)
const convenience = Image.resolveAssetSource(
	require('./optimized/convenience.jpg') as number,
)
const disco = Image.resolveAssetSource(
	require('./optimized/disco.jpg') as number,
)
const hallOfMusic = Image.resolveAssetSource(
	require('./optimized/hall-of-music.jpg') as number,
)
const halvorson = Image.resolveAssetSource(
	require('./optimized/halvorson.jpg') as number,
)
const oldMain = Image.resolveAssetSource(
	require('./optimized/old-main.jpg') as number,
)
const pauseKitchen = Image.resolveAssetSource(
	require('./optimized/pause-kitchen.jpg') as number,
)
const print = Image.resolveAssetSource(
	require('./optimized/print.jpg') as number,
)
const postOffice = Image.resolveAssetSource(
	require('./optimized/post-office.jpg') as number,
)
const regentsHall = Image.resolveAssetSource(
	require('./optimized/regents-hall.jpg') as number,
)
const regentsMath = Image.resolveAssetSource(
	require('./optimized/regents-math.jpg') as number,
)
const rolvaagLibrary = Image.resolveAssetSource(
	require('./optimized/rolvaag-library.jpg') as number,
)
const skifterStudioa = Image.resolveAssetSource(
	require('./optimized/skifter-studioa.jpg') as number,
)
const skoglund = Image.resolveAssetSource(
	require('./optimized/skoglund.jpg') as number,
)
const stav = Image.resolveAssetSource(require('./optimized/stav.jpg') as number)
const theater = Image.resolveAssetSource(
	require('./optimized/theater.jpg') as number,
)
const tomPorter = Image.resolveAssetSource(
	require('./optimized/tom-porter.jpg') as number,
)
const tomson = Image.resolveAssetSource(
	require('./optimized/tomson.jpg') as number,
)
const wellness = Image.resolveAssetSource(
	require('./optimized/wellness.jpg') as number,
)

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
