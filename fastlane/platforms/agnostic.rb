# These lanes are non-platform-specific
desc 'Bump the version string to a new version'
lane :bump do |options|
  old_version = get_package_key(key: :version)
  UI.message("Current version: #{old_version}")
  new_version = options[:version] || UI.input('New version: ').strip
  UI.message("Upgrading from #{old_version} to #{new_version}")

  # update iOS version
  increment_version_number(version_number: new_version,
                           xcodeproj: ENV['GYM_PROJECT'])
  # update Android version
  set_gradle_version_name(version_name: new_version,
                          gradle_path: lane_context[:GRADLE_FILE])
  # update package.json version
  set_package_data(data: { version: new_version })
end

desc 'Copy the package.json version into the other version locations'
lane :'propagate-version' do |options|
  version = get_package_key(key: :version)
  UI.message "Propagating version: #{version}"
  UI.message "into the Info.plist and build.gradle files"

  # update iOS version
  # we're splitting here because iTC can't handle versions with dashes in them
  increment_version_number(version_number: version.split('-')[0],
                           xcodeproj: ENV['GYM_PROJECT'])
  increment_build_number(xcodeproj: ENV['GYM_PROJECT'])

  # update Android version
  set_gradle_version_name(version_name: version,
                          gradle_path: lane_context[:GRADLE_FILE])

  current_version_code = get_gradle_version_code(gradle_path: lane_context[:GRADLE_FILE])
  set_gradle_version_code(version_code: current_version_code + 1,
                          gradle_path: lane_context[:GRADLE_FILE])
end

desc 'Build the release notes: branch, commit hash, changelog'
lane :release_notes do |options|
  notes = <<~END
    branch: #{git_branch}
    git commit: #{last_git_commit[:commit_hash]}

    ## Changelog
    (empty)
  END
  UI.message notes
  notes
end

desc 'run `npm run bundle-data`'
lane :bundle_data do
  sh('npm run bundle-data')
end

desc 'clone the match repo'
private_lane :clone_match do
  git_url = 'https://github.com/hawkrives/aao-keys'
  dir = Dir.mktmpdir
  command = "git clone --depth 1 '#{git_url}' '#{dir}'"

  # this block pulled from https://github.com/fastlane/fastlane/blob/master/match/lib/match/git_helper.rb
  UI.message 'Cloning remote git repo...'
  begin
    # GIT_TERMINAL_PROMPT will fail the `git clone` command if user credentials are missing
    FastlaneCore::CommandExecutor.execute(command: "GIT_TERMINAL_PROMPT=0 #{command}",
                                          print_all: true,
                                          print_command: true)
  rescue
    UI.error 'Error cloning the certificates repo. Please make sure you have read access to the repository you want to use'
    UI.error "Run the following command manually to make sure you're properly authenticated:"
    UI.command command
    UI.user_error! 'Error cloning the certificates git repo. Please make sure you have access to the repository - see instructions above'
  end

  dir
end

desc 'remove the match cloned folder'
private_lane :remove_match_clone do |options|
  UI.command "removing #{options[:dir]}"
  FileUtils.remove_entry_secure options[:dir]
end

desc 'Set up the private keys + environment variables for local development'
lane :keys do
  match_dir = clone_match

  # copy play-private-key.json
  play_key = 'play-private-key.json'
  UI.command "cp #{match_dir}/android/#{play_key} ../fastlane/#{play_key}"
  FileUtils.cp("#{match_dir}/android/#{play_key}", "../fastlane/#{play_key}")

  # copy .env.js
  UI.command "cp #{match_dir}/js/env.js ../.env.js"
  FileUtils.cp("#{match_dir}/js/env.js", "../.env.js")

  remove_match_clone(dir: match_dir)
end
