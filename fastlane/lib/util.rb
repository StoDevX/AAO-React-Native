# Retrieves the last-built commit from the current branch's released betas
def hockeyapp_version_commit()
  latest_hockeyapp_notes(release_branch: git_branch)[:commit_hash]
end

# Gets the "current" version, either from Travis or from Hockey
def current_build_number()
  ENV['TRAVIS_BUILD_NUMBER'] || latest_hockeyapp_version_number + 1
end

# Add the github token for stodevx-bot to the CI machine
def authorize_ci_for_keys()
  token = ENV['CI_USER_TOKEN']

  # see macoscope.com/blog/simplify-your-life-with-fastlane-match
  # we're allowing the CI access to the keys repo
  File.open("#{ENV['HOME']}/.netrc", 'a+') do |file|
    file << "machine github.com\n  login #{token}"
  end
end

# It doesn't make sense to duplicate this in both platforms, and fastlane is
# smart enough to call the appropriate platform's "beta" lane. Anyway, this
# makes a beta build if there have been new commits since the last beta.
def auto_beta()
  last_commit = hockeyapp_version_commit
  current_commit = last_git_commit[:commit_hash]

  UI.message 'In faux-git terms:'
  UI.message "origin/hockeyapp: #{last_commit}"
  UI.message "HEAD: #{current_commit}"
  UI.message "Thus, will we beta? #{last_commit != current_commit ? "yes" : "no"}"

  beta if last_commit != current_commit
end

# Makes a changelog from the time since the last commit
def changelog()
  to_ref = ENV['TRAVIS_COMMIT'] || 'HEAD'
  from_ref = hockeyapp_version_commit || 'HEAD~3'

  sh("git log #{from_ref}..#{to_ref} --pretty='%an, %aD (%h)%n> %s%n'")
    .lines
    .map { |line| '    ' + line }
    .join
end
