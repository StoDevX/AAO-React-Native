import {Image, ImageResolvedAssetSource} from 'react-native'
import rawAlumniHall from './optimized/alumni-hall.jpg'
import rawBoe from './optimized/boe.jpg'
import rawBookstore from './optimized/bookstore.jpg'
import rawBuntrock from './optimized/buntrock.jpg'
import rawCage from './optimized/cage.jpg'
import rawCenterForArtsAndDance from './optimized/center-for-arts-and-dance.jpg'
import rawChristiansen from './optimized/christiansen.jpg'
import rawConvenience from './optimized/convenience.jpg'
import rawDisco from './optimized/disco.jpg'
import rawHallOfMusic from './optimized/hall-of-music.jpg'
import rawHalvorson from './optimized/halvorson.jpg'
import rawOldMain from './optimized/old-main.jpg'
import rawPauseKitchen from './optimized/pause-kitchen.jpg'
import rawPrint from './optimized/print.jpg'
import rawPostOffice from './optimized/post-office.jpg'
import rawRegentsHall from './optimized/regents-hall.jpg'
import rawRegentsMath from './optimized/regents-math.jpg'
import rawRolvaagLibrary from './optimized/rolvaag-library.jpg'
import rawSkifterStudioa from './optimized/skifter-studioa.jpg'
import rawSkoglund from './optimized/skoglund.jpg'
import rawStav from './optimized/stav.jpg'
import rawTheater from './optimized/theater.jpg'
import rawTomPorter from './optimized/tom-porter.jpg'
import rawTomson from './optimized/tomson.jpg'
import rawWellness from './optimized/wellness.jpg'

const alumniHall = Image.resolveAssetSource(rawAlumniHall)
const boe = Image.resolveAssetSource(rawBoe)
const bookstore = Image.resolveAssetSource(rawBookstore)
const buntrock = Image.resolveAssetSource(rawBuntrock)
const cage = Image.resolveAssetSource(rawCage)
const centerForArtsAndDance = Image.resolveAssetSource(rawCenterForArtsAndDance)
const christiansen = Image.resolveAssetSource(rawChristiansen)
const convenience = Image.resolveAssetSource(rawConvenience)
const disco = Image.resolveAssetSource(rawDisco)
const hallOfMusic = Image.resolveAssetSource(rawHallOfMusic)
const halvorson = Image.resolveAssetSource(rawHalvorson)
const oldMain = Image.resolveAssetSource(rawOldMain)
const pauseKitchen = Image.resolveAssetSource(rawPauseKitchen)
const print = Image.resolveAssetSource(rawPrint)
const postOffice = Image.resolveAssetSource(rawPostOffice)
const regentsHall = Image.resolveAssetSource(rawRegentsHall)
const regentsMath = Image.resolveAssetSource(rawRegentsMath)
const rolvaagLibrary = Image.resolveAssetSource(rawRolvaagLibrary)
const skifterStudioa = Image.resolveAssetSource(rawSkifterStudioa)
const skoglund = Image.resolveAssetSource(rawSkoglund)
const stav = Image.resolveAssetSource(rawStav)
const theater = Image.resolveAssetSource(rawTheater)
const tomPorter = Image.resolveAssetSource(rawTomPorter)
const tomson = Image.resolveAssetSource(rawTomson)
const wellness = Image.resolveAssetSource(rawWellness)

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
