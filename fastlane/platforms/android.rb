platform :android do
  desc "Makes a build"
  lane :build do
    gradle(
      task: "assemble",
      build_type: "Release",
      print_command: true,
      print_command_output: true,
    )
  end

  desc "Submit a new Beta Build to HockeyApp"
  lane :beta do
    set_version(
      version: lane_context[:VERSION_NUMBER],
      build: lane_context[:BUILD_NUMBER],
    )

    build

    # Upload to HockeyApp
    hockey(notes: release_notes)
  end

  desc "Set the version in build.gradle"
  private_lane :set_version do |options|
    set_gradle_version_name(
      version_name: "#{options[:version]}.#{options[:build]}",
      gradle_file: lane_context[:GRADLE_FILE],
    )

    set_gradle_version_code(
      version_code: options[:build],
      gradle_file: lane_context[:GRADLE_FILE],
    )

    package_set_data(data: {:version => "#{options[:version]}.#{options[:build]}"})
  end

  desc "Run the appropriate action on CI"
  lane :ci_run do
    authorize_ci_for_keys

    case
      when ENV["run_deploy"] == "1" then
        auto_beta
      else
        build
    end
  end
end
