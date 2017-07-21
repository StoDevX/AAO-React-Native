# Adds the github token for stodevx-bot to the CI machine
def authorize_ci_for_keys
  token = ENV['CI_USER_TOKEN']

  # see macoscope.com/blog/simplify-your-life-with-fastlane-match
  # we're allowing the CI access to the keys repo
  File.open("#{ENV['HOME']}/.netrc", 'a+') do |file|
    file << "machine github.com\n  login #{token}"
  end
end

# Gets the version, either from Travis or from Hockey
def current_build_number
  if ENV.key?('TRAVIS_BUILD_NUMBER')
    return ENV['TRAVIS_BUILD_NUMBER']
  end

  begin
    case lane_context[:PLATFORM_NAME]
    when :android
      UI.input "Please enter a build number: "
    when :ios
      (latest_testflight_build_number + 1).to_s
    else
      UI.input "Please enter a build number: "
    end
  rescue
    '1'
  end
end

# Get the current "app bundle" version
def current_bundle_version
  case lane_context[:PLATFORM_NAME]
  when :android
    get_gradle_version_name(gradle_path: lane_context[:GRADLE_FILE])
  when :ios
    get_info_plist_value(path: 'ios/AllAboutOlaf/Info.plist',
                         key: 'CFBundleShortVersionString')
  else
    get_package_key(key: :version)
  end
end

# Makes a changelog from the timespan passed
def make_changelog
  to_ref = ENV['TRAVIS_COMMIT'] || 'HEAD'
  from_ref = hockeyapp_version_commit || 'HEAD~3'

  sh("git log #{from_ref}..#{to_ref} --pretty='%an, %aD (%h)%n> %s%n'")
    .lines
    .map { |line| '    ' + line }
    .join
end

# It doesn't make sense to duplicate this in both platforms, and fastlane is
# smart enough to call the appropriate platform's "beta" lane. So, let's make
# a beta build if there have been new commits since the last beta.
def auto_beta
  # last_commit = hockeyapp_version_commit
  # current_commit = last_git_commit[:commit_hash]

  # UI.message 'In faux-git terms:'
  # UI.message "origin/hockeyapp: #{last_commit}"
  # UI.message "HEAD: #{current_commit}"
  # will_beta = last_commit != current_commit ? 'yes' : 'no'
  # UI.message "Thus, will we beta? #{will_beta}"

  # beta # if last_commit != current_commit

  if ENV['run_deploy'] == '1'
      beta
  else
    build
  end
end
