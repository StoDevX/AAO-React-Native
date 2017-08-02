desc 'Build the release notes: branch, commit hash, changelog'
private_lane :release_notes do |options|
  notes = <<~END
    branch: #{git_branch}
    git commit: #{last_git_commit[:commit_hash]}

    ## Changelog
    (empty)
  END
  UI.message notes
  notes
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
