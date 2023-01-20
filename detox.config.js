// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * @typedef { typeof import("detox") } detox
 * @typedef { Parameters<detox['init']>[0] } DetoxConfig
 * @typedef { 'Debug' | 'Release' } Configuration
 */

const fs = require('node:fs')
const process = require('node:process')
const path = require('node:path')

/**
 * @returns {string}
 */
function findCurrentDeploymentTarget() {
	let pbxproj = fs.readFileSync(
		path.join(__dirname, 'ios', 'AllAboutOlaf.xcodeproj', 'project.pbxproj'),
		{encoding: 'utf-8'},
	)

	const target = pbxproj
		.split('\n')
		.find((line) => line.includes('IPHONEOS_DEPLOYMENT_TARGET'))
		?.replace(/.*IPHONEOS_DEPLOYMENT_TARGET = (.*?);/u, '$1')

	if (!target || !/\d+[.]\d+/u.test(target)) {
		console.error(
			`Could not find valid IPHONEOS_DEPLOYMENT_TARGET; found ${target}`,
		)
		process.exit(1)
	}

	return target
}

const iPhoneSimulatorDevice = 'iPhone 11 Pro'
const currentDeploymentTarget = findCurrentDeploymentTarget()

/**
 * @param {Configuration} configuration
 * @returns {string}
 */
function generateBuildCommand(configuration) {
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

/**
 * @param {Configuration} configuration
 * @returns {string}
 */
function generateBinaryPath(configuration) {
	return path.join(
		'ios',
		'build',
		'Build',
		'Products',
		`${configuration}-iphonesimulator`,
		'AllAboutOlaf.app',
	)
}

/** @type DetoxConfig */
module.exports = {
	testRunner: 'jest --config e2e/jest.config.js e2e',

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
			binaryPath: generateBinaryPath('Debug'),
			build: generateBuildCommand('Debug'),
		},
		'ios.sim.release': {
			type: 'ios.app',
			binaryPath: generateBinaryPath('Release'),
			build: generateBuildCommand('Release'),
		},
	},

	devices: {
		'ios.simulator': {
			type: 'ios.simulator',
			device: {
				type: iPhoneSimulatorDevice,
				os: currentDeploymentTarget,
			},
		},
	},
}
