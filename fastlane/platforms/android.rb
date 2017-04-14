platform :android do
  desc "Makes a build"
  lane :build do
    # make sure we have a copy of the data files
    bundle_data

    version = get_current_bundle_version(platform: "Android")
    build_number = get_current_build_number(platform: "Android")

    set_version_name(version_name: "#{version}.#{build_number}", gradle_path: "android/app/build.gradle")
    set_gradle_version_code(version_code: build_number, gradle_path: "./android/app/build.gradle")
    set_package_data(data: {"version" => "#{version}.#{build_number}"})

    gradle(
      task: "assemble",
      build_type: "Release",
      project_dir: "./android",
      print_command: true,
      print_command_output: true,
    )
  end

  desc "Submit a new Beta Build to HockeyApp"
  lane :beta do
    build

    # Upload to HockeyApp
    hockey(
      api_token: ENV["HOCKEYAPP_TOKEN"],
      apk: "./android/app/build/outputs/apk/app-release-unsigned.apk",
      commit_sha: ENV["TRAVIS_COMMIT"],
      notes: build_notes(platform: 'Android'),
    )
  end

  desc "Make a beta build if there have been new commits since the last beta"
  lane :auto_beta do
    last_commit = get_hockeyapp_version_commit(platform: 'Android')
    current_commit = last_git_commit[:commit_hash]
    UI.message "In faux-git terms:"
    UI.message "origin/hockeyapp: #{last_commit}"
    UI.message "HEAD: #{current_commit}"
    UI.message "Thus, will we beta? #{last_commit != current_commit}"
    beta unless last_commit == current_commit
  end

  desc "Run the appropriate action on CI"
  lane :ci_run do
    should_deploy = ENV["run_deploy"] == "1"
    if should_deploy
      auto_beta
    else
      build
    end
  end
end
