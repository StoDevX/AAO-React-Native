// taken from https://github.com/wix/Detox/blob/18.6.0/examples/demo-react-native-jest/e2e/environment.js

const {
	DetoxCircusEnvironment,
	SpecReporter,
	WorkerAssignReporter,
} = require('detox/runners/jest-circus')

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
	constructor(config, context) {
		super(config, context)

		// this.initTimeout = 300000;

		this.registerListeners({
			SpecReporter,
			WorkerAssignReporter,
		})
	}
}

module.exports = CustomDetoxEnvironment
