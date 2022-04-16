bootstrap: bootstrap-android bootstrap-ios

bootstrap-ios: pods bootstrap-js

bootstrap-android: jetify bootstrap-js

android-dependencies:
	cd android && ./gradlew androidDependencies --console=plain

bootstrap-js:
	npm ci

bootstrap-ios-detox:
	brew tap wix/brew
	brew install applesimutils

bootstrap-patch:
	patch -p0 -Nfsi contrib/*.patch || true

jetify:
	npx jetify

bundle:
	bundle install

pods:
	cd ios && bundle exec pod install --deployment
	@echo 'try running "bundle exec pod install --repo-update"' 1>&2


data-bundle:  ## comment
	node scripts/bundle-data.mjs data/ docs/

data-compress:
	gzip --keep docs/*.json

data-validate-bus:
	node scripts/validate-bus-schedules.mjs

data-validate:
	node scripts/validate-data.mjs


bundle-android:
	npx react-native bundle --entry-file index.js --dev true --platform android --bundle-output ./android/app/src/main/assets/index.android.bundle --assets-dest ./android/app/src/main/res/ --sourcemap-output ./android/app/src/main/assets/index.android.bundle.map

bundle-ios:
	npx react-native bundle --entry-file index.js --dev false --platform ios --bundle-output ./ios/AllAboutOlaf/main.jsbundle --assets-dest ./ios --sourcemap-output ./ios/AllAboutOlaf/main.jsbundle.map

start:
	npx react-native start


lint:
	npx eslint --report-unused-disable-directives --cache source/ modules/ scripts/ images/

format:
	npx prettier --write '{source,modules,scripts,images,e2e}/**/*.{js,ts,tsx,json}' 'data/**/*.css' '{*,.*}.{yaml,yml,json,js,ts,tsx}'

format-check:
	npx prettier --no-write --list-different '{source,modules,scripts,images,e2e}/**/*.{js,ts,tsx,json}' 'data/**/*.css' '{*,.*}.{yaml,yml,json,js,ts,tsx}'

test-js:
	jest

test-js-coverage:
	jest --coverage

typecheck:
	npx tsc


detox-ios-build: bootstrap-ios-detox
	npx detox build e2e --configuration ios.sim.release

detox-ios-test:
	npx detox test e2e --configuration ios.sim.release --cleanup
