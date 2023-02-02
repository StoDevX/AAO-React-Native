/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-empty-function */

/**
 * Mocked sentry.ts functionality goes in this file
 *
 * We are timing out in our Detox tests due to timers going on
 * within Sentry. When we call NavigationContainer.onReady and
 * instantiate Sentry's instrumentation, we end up in a place
 * where timers are not finishing and we end up timing out our
 * Detox tests.
 *
 * We can handle this by doing the following:
 * 1. Set up a metro resolver for files ending in .mock.ts
 * 2. Stub out calls and values in the .mock.ts file
 * 3. Let metro handle resolving things when it comes across
 *    process.env.APP_MODE='mocked'
 *
 * https://github.com/wix/Detox/blob/master/docs/guide/mocking.md
 */

export * from './sentry'

export const install = (): void => {}

export const routingInstrumentation = {
	registerNavigationContainer: (
		navigationRef: React.MutableRefObject<undefined>,
	) => {},
}
