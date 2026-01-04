import {Image, type ImageResolvedAssetSource} from 'react-native'

const alumniwest = Image.resolveAssetSource(
	require('./alumniwest.jpg') as number,
)
const bcplaza = Image.resolveAssetSource(require('./bcplaza.jpg') as number)
const eastquad = Image.resolveAssetSource(require('./eastquad.jpg') as number)
const tomsoneast = Image.resolveAssetSource(
	require('./tomsoneast.jpg') as number,
)
const tomsonwest = Image.resolveAssetSource(
	require('./tomsonwest.jpg') as number,
)
const oleave = Image.resolveAssetSource(require('./oleave.jpg') as number)
const madson = Image.resolveAssetSource(require('./madson.jpg') as number)

export const images = new Map<string, ImageResolvedAssetSource>([
	['alumniwest', alumniwest],
	['bcplaza', bcplaza],
	['eastquad', eastquad],
	['tomsoneast', tomsoneast],
	['tomsonwest', tomsonwest],
	['oleave', oleave],
	['madson', madson],
])
