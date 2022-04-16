run:android:
	npx react-native run-android

data:bundle:
	node scripts/bundle-data.mjs data/ docs/

bundle:android:
	npx react-native bundle --entry-file index.js --dev true --platform android --bundle-output ./android/app/src/main/assets/index.android.bundle --assets-dest ./android/app/src/main/res/ --sourcemap-output ./android/app/src/main/assets/index.android.bundle.map

bundle:ios:
	npx react-native bundle --entry-file index.js --dev false --platform ios --bundle-output ./ios/AllAboutOlaf/main.jsbundle --assets-dest ./ios --sourcemap-output ./ios/AllAboutOlaf/main.jsbundle.map

fastlane:
	bundle exec fastlane

data:compress:
	gzip --keep docs/*.json

run:ios:
	npx react-native run-ios

lint:
	npx eslint --report-unused-disable-directives --cache source/ modules/ scripts/ images/

bootstrap:android:
	npx jetifier

bootstrap:patch:
	patch -p0 -Nfsi contrib/*.patch || true

format:
	npx prettier --write '{source,modules,scripts,images,e2e}/**/*.{js,ts,tsx,json}' 'data/**/*.css' '{*,.*}.{yaml,yml,json,js,ts,tsx}'

pods:
	scripts/pods.sh

run:
	npx react-native start

test:js:
	jest

validate-bus-data:
	node scripts/validate-bus-schedules.mjs
	
validate-data:
	node scripts/validate-data.mjs
