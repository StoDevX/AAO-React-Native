const fs = require('fs')
const process = require('process')
const path = require('path')

const currentDeploymentTarget = fs
	.readFileSync(
		path.join(__dirname, 'ios', 'AllAboutOlaf.xcodeproj', 'project.pbxproj'),
		{encoding: 'utf-8'},
	)
	.split('\n')
	.find((line) => line.includes('IPHONEOS_DEPLOYMENT_TARGET'))
	.replace(/.*IPHONEOS_DEPLOYMENT_TARGET = (.*?);/, '$1')

if (!/\d+[.]\d+/.test(currentDeploymentTarget)) {
	console.error(
		`Could not find valid IPHONEOS_DEPLOYMENT_TARGET; found ${currentDeploymentTarget}`,
	)
	process.exit(1)
}

const iPhoneSimulatorDevice = 'iPhone 11 Pro'

function generateBuildCommand({configuration}) {
	return [
		'xcodebuild',
		'-workspace ios/AllAboutOlaf.xcworkspace',
		'-scheme AllAboutOlaf',
		`-configuration ${configuration}`,
		`-destination 'platform=iOS Simulator,name=${iPhoneSimulatorDevice},OS=${currentDeploymentTarget}'`,
		'-derivedDataPath ios/build',
		'build',
	].join(' ')
}

module.exports = {
	'test-runner': 'jest',
	specs: '',

	configurations: {
		'ios.sim.debug': {
			device: 'ios.simulator',
			app: 'ios.sim.debug',
		},
		'ios.sim.release': {
			device: 'ios.simulator',
			app: 'ios.sim.release',
		},
	},

	apps: {
		'ios.sim.debug': {
			type: 'ios.app',
			binaryPath:
				'ios/build/Build/Products/Debug-iphonesimulator/AllAboutOlaf.app',
			build: generateBuildCommand({configuration: 'Debug'}),
		},
		'ios.sim.release': {
			type: 'ios.app',
			binaryPath:
				'ios/build/Build/Products/Release-iphonesimulator/AllAboutOlaf.app',
			build: generateBuildCommand({configuration: 'Release'}),
		},
	},

	devices: {
		'ios.simulator': {
			type: 'ios.simulator',
			device: {
				type: iPhoneSimulatorDevice,
			},
		},
	},
}
