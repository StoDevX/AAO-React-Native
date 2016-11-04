const childSpawn = require('child_process').spawn

const source = 'icon-source.png'

const spawn = (cmd, args) => {
  console.log(cmd, ...args)
  childSpawn(cmd, args)
}

// iOS app icons
// for (let size of [29, 40, 60, 76, 83.5]) {
for (let size of [29, 40, 60]) {
  for (let x of [1, 2, 3]) {
    if ((x === 1) && [40, 60].indexOf(size) >= 0) {
      continue
    }
    let s = size * x
    spawn('convert', [source, '-resize', `${s}x${s}`, `icons/ios/AppIcon.appiconset/Icon-${size}@${x}x.png`])
  }
}

// iTunes icons
spawn('convert', [source, '-resize', '512x512', 'icons/ios/iTunesArtwork@1x.png'])
spawn('convert', [source, '-resize', '1024x1024', 'icons/ios/iTunesArtwork@2x.png'])
spawn('convert', [source, '-resize', '1536x1536', 'icons/ios/iTunesArtwork@3x.png'])


// Android app icons
let androidSizes = new Map([
  ['ldpi', 36],
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192],
])

for (let [name, size] of androidSizes.entries()) {
  spawn('convert', [source, '-resize', `${size}x${size}`, `icons/android/mipmap-${name}/ic_launcher.png`])
}

spawn('convert', [source, '-resize', '512x512', 'icons/android/playstore-icon.png'])
