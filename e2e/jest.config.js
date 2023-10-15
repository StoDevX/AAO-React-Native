module.exports = {
	preset: 'ts-jest',
	maxWorkers: 1,
	rootDir: '..',
	testMatch: ['<rootDir>/e2e/**/*.(test|spec).ts'],
	setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
	testTimeout: 120000,
	verbose: true,
	reporters: ['detox/runners/jest/reporter'],
	globalSetup: 'detox/runners/jest/globalSetup',
	globalTeardown: 'detox/runners/jest/globalTeardown',
	testEnvironment: 'detox/runners/jest/testEnvironment',
}
