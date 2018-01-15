# coding: utf-8
require 'json'

platform :ios do
  desc 'Runs all the tests'
  lane :test do
    scan(scheme: ENV['GYM_SCHEME'], project: ENV['GYM_PROJECT'])
  end

  desc 'Take screenshots'
  lane :screenshot do
    devices = [
      'iPhone 7 Plus',
      'iPhone 6',
      'iPhone 5s',
      # 'iPhone 4s',
      'iPad Pro (9.7-inch)',
      'iPad Pro (12.9-inch)',
    ]
    snapshot(devices: devices,
             languages: ['en-US'],
             scheme: ENV['GYM_SCHEME'],
             project: ENV['GYM_PROJECT'],
             # concurrent_simulators: false,
             number_of_retries: 0)
  end

  desc 'Checks that the app can be built'
  lane :check_build do
    # fetch the directory where Xcode will put the .app
    settings = FastlaneCore::Helper.backticks(%(xcodebuild -showBuildSettings -configuration Debug -scheme "#{ENV['GYM_SCHEME']}" -project "../#{ENV['GYM_PROJECT']}" -destination 'generic/platform=iOS'))
    products_dir = settings.split("\n").select { |line| line =~ /\bBUILT_PRODUCTS_DIR =/ }.uniq
    products_dir = products_dir.map { |entry| entry.gsub(/.*BUILT_PRODUCTS_DIR = /, '') }
    products = products_dir.map { |entry| entry + "/#{ENV['GYM_OUTPUT_NAME']}.app/" }

    # save it to a log file for later use
    FileUtils.mkdir_p('../logs')
    File.open('../logs/products', 'w') { |file| file.write(products.to_json) }

    # build the .app
    build_status = 0
    begin
      propagate_version
      xcodebuild(
        build: true,
        scheme: ENV['GYM_SCHEME'],
        project: ENV['GYM_PROJECT'],
        destination: 'generic/platform=iOS',
        xcargs: %(CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="")
      )
    rescue IOError => e
      build_status = 1
      raise e
    ensure
      File.open('../logs/build-status', 'w') { |file| file.write(build_status.to_s) }
    end
  end

  desc 'Builds and exports the app'
  lane :build do
    match(type: 'appstore', readonly: true)
    propagate_version
    gym(include_bitcode: true,
        include_symbols: true)
  end

  desc 'Submit a new Beta Build to Testflight'
  lane :beta do
    build
    testflight
  end

  desc 'Submit a new nightly Beta Build to Testflight'
  lane :nightly do
    build
    # TestFlight is returning 500 errors when we upload changelogs again.
    begin
      testflight(changelog: make_changelog,
                 distribute_external: false)
    rescue => error
      puts 'Changelog failed to upload:'
      puts error
    end
    generate_sourcemap
    upload_sourcemap_to_bugsnag
  end

  desc 'Bundle an iOS sourcemap'
  lane :sourcemap do
    generate_sourcemap
  end

  desc 'Upload dYSM symbols to Bugsnag from Apple'
  lane :refresh_dsyms do
    download_dsyms
    upload_symbols_to_bugsnag
    clean_build_artifacts
  end

  desc 'Run iOS builds or tests, as appropriate'
  lane :'ci-run' do
    # set up things so they can run
    authorize_ci_for_keys

    # and run
    auto_beta

    # go ahead and download dSYMs for bugsnag too
    refresh_dsyms if travis?
  end
end
