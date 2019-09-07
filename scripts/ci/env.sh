# The bundle identifier of your app
export APP_IDENTIFIER='NFMTHAZVS9.com.drewvolz.stolaf'

# Your Apple email address
export APPLE_ID='aao_bot@fastmail.fm'
export APPLE_DEV_PORTAL_ID='hawkrives@gmail.com'

# Your Apple Developer Team ID, if you are in multiple teams
export TEAM_ID='TMK6S7TPX2'
export ITC_TEAM_ID='118781268'

# This is a private key. It is not included in the repository.
# Contact allaboutolaf@stolaf.edu or another admin if you need access.
export JSON_KEY_FILE='./fastlane/play-private-key.json'
export PACKAGE_NAME='com.allaboutolaf'

# set up global info for `gym`
export GYM_PROJECT='./ios/AllAboutOlaf.xcodeproj'
export IOS_INFO_PLIST='./ios/AllAboutOlaf/Info.plist'
export GYM_SCHEME='AllAboutOlaf'
export GYM_OUTPUT_DIRECTORY='./ios/build'
export GYM_OUTPUT_NAME='AllAboutOlaf'
export GYM_ARCHIVE_PATH='./ios/archive/app.xcarchive'

# set the testflight itunesconnect provider ID from Appfile
export PILOT_ITC_PROVIDER="$TEAM_ID"

export GRADLE_FILE='./android/app/build.gradle'
export KEYSTORE_FILE='./android/app/upload-keystore.properties'

# set up other global shared values
export PRETTY_APP_NAME='All About Olaf'
export ONESIGNAL_APP_NAME='All About Olaf'
export ONESIGNAL_APP_ID='a46c6f2f-a240-4908-a359-801911e9b9ea'
export APPLE_APP_ID="$APP_IDENTIFIER"
export APPLE_APP_NAME='All About Olaf'
export APPLE_PUSH_EXTENSION_ID='NFMTHAZVS9.com.drewvolz.stolaf.onesignal-notification-service-extension'
export APPLE_PUSH_EXTENSION_NAME='All About Olaf OneSignal Notification Service Extension'
