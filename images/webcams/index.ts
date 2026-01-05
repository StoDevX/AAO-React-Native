import {Image, type ImageResolvedAssetSource} from 'react-native'

const alumniwest = Image.resolveAssetSource(require('./alumniwest.jpg'))
const bcplaza = Image.resolveAssetSource(require('./bcplaza.jpg'))
const eastquad = Image.resolveAssetSource(require('./eastquad.jpg'))
const tomsoneast = Image.resolveAssetSource(require('./tomsoneast.jpg'))
const tomsonwest = Image.resolveAssetSource(require('./tomsonwest.jpg'))
const oleave = Image.resolveAssetSource(require('./oleave.jpg'))
const madson = Image.resolveAssetSource(require('./madson.jpg'))

export const images = new Map<string, ImageResolvedAssetSource>([
	['alumniwest', alumniwest],
	['bcplaza', bcplaza],
	['eastquad', eastquad],
	['tomsoneast', tomsoneast],
	['tomsonwest', tomsonwest],
	['oleave', oleave],
	['madson', madson],
])
