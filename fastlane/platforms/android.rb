platform :android do
  desc 'Makes a build'
  lane :build do
    # make sure we have a copy of the data files
    bundle_data

    set_version(version: current_bundle_version,
                build_number: current_build_number)

    gradle(
      task: 'assemble',
      build_type: 'Release',
      project_dir: './android',
      print_command: true,
      print_command_output: true
    )
  end

  desc 'Submit a new Beta Build to HockeyApp'
  lane :beta do
    build

    # Upload to HockeyApp
    hockey(
      apk: lane_context[SharedValues::GRADLE_APK_OUTPUT_PATH],
      notes: release_notes
    )
  end

  private_lane :set_version do |options|
    version = options[:version]
    build = options[:build_number]
    set_gradle_version_name(version_name: "#{version}.#{build}",
                            gradle_path: 'android/app/build.gradle')
    set_gradle_version_code(version_code: build,
                            gradle_path: './android/app/build.gradle')
    set_package_data(data: { version: "#{version}.#{build}" })
  end

  desc 'Run the appropriate action on CI'
  lane :'ci-run' do
    # prepare for the bright future with signed android betas
    authorize_ci_for_keys

    # and run
    should_deploy = ENV['run_deploy'] == '1'
    if should_deploy
      auto_beta
    else
      build
    end
  end
end
