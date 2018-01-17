const childSpawn = require('child_process').spawnSync
const source = 'icon-source.png'

const spawn = (cmd, ...args) => {
	console.log(cmd, ...args)
	childSpawn(cmd, args)
}

const resize = (img, width, toFile) =>
	spawn('convert', img, '-resize', `${width}x${width}`, toFile)

// iOS app icons
const iosSizes = [[29, 1], [29, 2], [29, 3], [40, 2], [40, 3], [60, 2], [60, 3]]
for (const [width, density] of iosSizes) {
	resize(
		source,
		width * density,
		`icons/ios/AppIcon.appiconset/Icon-${width}@${density}x.png`,
	)
}

// iTunes icons
const itunes = [[512, 1], [1024, 2], [1536, 3]]
for (const [width, density] of itunes) {
	resize(source, width, `icons/ios/iTunesArtwork@${density}x.png`)
}

// Android app icons
const androidSizes = [
	['ldpi', 36],
	['mdpi', 48],
	['hdpi', 72],
	['xhdpi', 96],
	['xxhdpi', 144],
	['xxxhdpi', 192],
]
for (const [label, size] of androidSizes) {
	resize(source, size, `icons/android/mipmap-${label}/ic_launcher.png`)
}

resize(source, '512', 'icons/android/playstore-icon.png')
