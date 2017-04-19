before_all do
  # too lazy to change the name in travis, so we jut copy it here
  ENV['FL_HOCKEY_API_TOKEN'] = ENV['HOCKEYAPP_TOKEN']
  ENV['FL_HOCKEY_COMMIT_SHA'] = ENV['TRAVIS_COMMIT']

  # set up global info for `gym`
  ENV['GYM_PROJECT'] = './ios/AllAboutOlaf.xcodeproj'
  ENV['GYM_SCHEME'] = 'AllAboutOlaf'
  ENV['GYM_OUTPUT_DIRECTORY'] = './ios/build'
  ENV['GYM_OUTPUT_NAME'] = 'AllAboutOlaf'

  # set up global info for `gradle`
  ENV['FL_GRADLE_PROJECT_DIR'] = './android'

  # set up other global shared values
  lane_context[:PRETTY_APP_NAME] = 'All About Olaf'

  lane_context[:GRADLE_FILE] = "#{ENV['FL_GRADLE_PROJECT_DIR']}/app/build.gradle"

  UI.message "FL_HOCKEY_COMMIT_SHA is #{ENV['FL_HOCKEY_COMMIT_SHA']}"
  UI.message "GYM_PROJECT is #{ENV['GYM_PROJECT']}"
  UI.message "GYM_SCHEME is #{ENV['GYM_SCHEME']}"
  UI.message "GYM_OUTPUT_DIRECTORY is #{ENV['GYM_OUTPUT_DIRECTORY']}"
  UI.message "GYM_OUTPUT_NAME is #{ENV['GYM_OUTPUT_NAME']}"
  UI.message "FL_GRADLE_PROJECT_DIR is #{ENV['FL_GRADLE_PROJECT_DIR']}"
  UI.message "PRETTY_APP_NAME is #{lane_context[:PRETTY_APP_NAME]}"
  UI.message "GRADLE_FILE is #{lane_context[:GRADLE_FILE]}"
  UI.message "PLATFORM_NAME is #{lane_context[:PLATFORM_NAME]}"
end
