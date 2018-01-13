before_all do
  case lane_context[:PLATFORM_NAME]
  when :ios
    setup_travis if travis?
    setup_circle_ci if circle?
  end

  # set up global info for `gym`
  ENV['GYM_PROJECT'] = './ios/AllAboutOlaf.xcodeproj'
  ENV['GYM_SCHEME'] = 'AllAboutOlaf'
  ENV['GYM_OUTPUT_DIRECTORY'] = './ios/build'
  ENV['GYM_OUTPUT_NAME'] = 'AllAboutOlaf'

  # set the testflight itunesconnect provider ID from Appfile
  ENV['PILOT_ITC_PROVIDER'] = CredentialsManager::AppfileConfig.try_fetch_value(:team_id)

  # set up global info for `gradle`
  ENV['FL_GRADLE_PROJECT_DIR'] = './android'

  # set up other global shared values
  lane_context[:PRETTY_APP_NAME] = 'All About Olaf'

  lane_context[:GRADLE_FILE] = "#{ENV['FL_GRADLE_PROJECT_DIR']}/app/build.gradle"

  UI.message "GYM_PROJECT is #{ENV['GYM_PROJECT']}"
  UI.message "GYM_SCHEME is #{ENV['GYM_SCHEME']}"
  UI.message "GYM_OUTPUT_DIRECTORY is #{ENV['GYM_OUTPUT_DIRECTORY']}"
  UI.message "GYM_OUTPUT_NAME is #{ENV['GYM_OUTPUT_NAME']}"
  UI.message "FL_GRADLE_PROJECT_DIR is #{ENV['FL_GRADLE_PROJECT_DIR']}"
  UI.message "PRETTY_APP_NAME is #{lane_context[:PRETTY_APP_NAME]}"
  UI.message "GRADLE_FILE is #{lane_context[:GRADLE_FILE]}"
  UI.message "PLATFORM_NAME is #{lane_context[:PLATFORM_NAME]}"
end
