const spawn = require('child_process').spawn

const source = 'icon-source.png'

// iOS app icons
for (let size of [29, 40, 60, 76, 83.5]) {
  for (let x of [1, 2, 3]) {
    if ((x === 1 || x === 3) && size === 83.5) {
      continue
    }
    let s = size * x
    spawn('convert', [source, '-resize', `${s}x${s}`, `ico/ios/AppIcon.appiconset/Icon-App-${size}x${size}@${x}x.png`])
  }
}

// iTunes icons
spawn('convert', [source, '-resize', '512x512', 'ico/ios/iTunesArtwork@1x.png'])
spawn('convert', [source, '-resize', '1024x1024', 'ico/ios/iTunesArtwork@2x.png'])
spawn('convert', [source, '-resize', '1536x1536', 'ico/ios/iTunesArtwork@3x.png'])


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
  spawn('convert', [source, '-resize', `${size}x${size}`, `ico/android/mipmap-${name}/ic_launcher.png`])
}

spawn('convert', [source, '-resize', '512x512', 'ico/android/playstore-icon.png'])
