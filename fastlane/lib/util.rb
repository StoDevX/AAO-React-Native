# Adds the github token for stodevx-bot to the CI machine
def authorize_ci_for_keys
  token = ENV['CI_USER_TOKEN']

  # see macoscope.com/blog/simplify-your-life-with-fastlane-match
  # we're allowing the CI access to the keys repo
  File.open("#{ENV['HOME']}/.netrc", 'a+') do |file|
    file << "machine github.com\n  login #{token}"
  end
end

# Get the hockeyapp version
def get_hockeyapp_version(_)
  latest_hockeyapp_version_number(
    app_name: 'All About Olaf',
  )
end

# Get the commit of the latest build on HockeyApp
def get_hockeyapp_version_commit(_)
  latest_hockeyapp_notes(
    app_name: 'All About Olaf',
  )[:commit_hash]
end

# Gets the version, either from Travis or from Hockey
def get_current_build_number(_)
  ENV['TRAVIS_BUILD_NUMBER'] if ENV.key?('TRAVIS_BUILD_NUMBER')

  begin
    (get_hockeyapp_version + 1).to_s
  rescue
    '1'
  end
end

# Get the current "app bundle" version
def get_current_bundle_version(_)
  if lane_context[:PLATFORM_NAME] == :android
    get_gradle_version_name(gradle_path: 'android/app/build.gradle')
  elsif lane_context[:PLATFORM_NAME] == :ios
    get_info_plist_value(path: 'ios/AllAboutOlaf/Info.plist',
                         key: 'CFBundleShortVersionString')
  end
end

# Makes a changelog from the timespan passed
def make_changelog(_)
  to_ref = ENV['TRAVIS_COMMIT'] || 'HEAD'
  from_ref = get_hockeyapp_version_commit || 'HEAD~3'

  sh("git log #{from_ref}..#{to_ref} --pretty='%an, %aD (%h)%n> %s%n'")
    .lines
    .map { |line| '    ' + line }
    .join
end

# It doesn't make sense to duplicate this in both platforms, and fastlane is
# smart enough to call the appropriate platform's "beta" lane. So, let's make
# a beta build if there have been new commits since the last beta.
def auto_beta(_)
  last_commit = get_hockeyapp_version_commit
  current_commit = last_git_commit[:commit_hash]

  UI.message 'In faux-git terms:'
  UI.message "origin/hockeyapp: #{last_commit}"
  UI.message "HEAD: #{current_commit}"
  will_beta = last_commit != current_commit ? 'yes' : 'no'
  UI.message "Thus, will we beta? #{will_beta}"

  beta if last_commit != current_commit
end
