import {Image, type ImageResolvedAssetSource} from 'react-native'
import rawAlumniwest from './alumniwest.jpg'
import rawBcplaza from './bcplaza.jpg'
import rawEastquad from './eastquad.jpg'
import rawTomsoneast from './tomsoneast.jpg'
import rawTomsonwest from './tomsonwest.jpg'
import rawOleave from './oleave.jpg'
import rawMadson from './madson.jpg'

const alumniwest = Image.resolveAssetSource(rawAlumniwest)
const bcplaza = Image.resolveAssetSource(rawBcplaza)
const eastquad = Image.resolveAssetSource(rawEastquad)
const tomsoneast = Image.resolveAssetSource(rawTomsoneast)
const tomsonwest = Image.resolveAssetSource(rawTomsonwest)
const oleave = Image.resolveAssetSource(rawOleave)
const madson = Image.resolveAssetSource(rawMadson)

export const images = new Map<string, ImageResolvedAssetSource>([
	['alumniwest', alumniwest],
	['bcplaza', bcplaza],
	['eastquad', eastquad],
	['tomsoneast', tomsoneast],
	['tomsonwest', tomsonwest],
	['oleave', oleave],
	['madson', madson],
])
