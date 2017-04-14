
desc "Get the hockeyapp version"
private_lane :get_hockeyapp_version do |options|
  latest_hockeyapp_version_number(
    api_token: ENV["HOCKEYAPP_TOKEN"],
    app_name: "All About Olaf",
    platform: options[:platform],
  )
end

desc "Get the commit of the latest build on HockeyApp"
private_lane :get_hockeyapp_version_commit do |options|
  latest_hockeyapp_notes(
    api_token: ENV["HOCKEYAPP_TOKEN"],
    app_name: "All About Olaf",
    platform: options[:platform],
  )[:commit_hash]
end

desc "Gets the version, either from Travis or from Hockey"
private_lane :get_current_build_number do |options|
  ENV["TRAVIS_BUILD_NUMBER"] || get_hockeyapp_version(platform: options[:platform]) + 1
end

private_lane :build_notes do |options|
  branch = git_branch
  sha = last_git_commit[:commit_hash]
  changelog = make_changelog(platform: options[:platform])
  "branch: #{branch}\ngit commit: #{sha}\n\n## Changelog\n#{changelog}"
end

private_lane :get_current_bundle_version do |options|
  if options[:platform] == 'Android'
    get_gradle_version_name(gradle_path: "android/app/build.gradle")
  elsif options[:platform] == 'iOS'
    get_info_plist_value(path: "ios/AllAboutOlaf/Info.plist", key: "CFBundleShortVersionString")
  end
end

desc "Makes a changelog from the timespan passed"
private_lane :make_changelog do |options|
  to_ref = ENV["TRAVIS_COMMIT"] || "HEAD"
  from_ref = get_hockeyapp_version_commit(platform: options[:platform]) || "HEAD~3"

  sh("git log #{from_ref}..#{to_ref} --pretty='%an, %aD (%h)%n> %s%n' | sed 's/^/    /'")
end

lane :bundle_data do |options|
  sh("npm run bundle-data")
end
