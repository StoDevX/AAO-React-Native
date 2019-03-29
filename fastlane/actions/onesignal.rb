module Fastlane
	module Actions
		module SharedValues
			ONE_SIGNAL_APP_ID = :ONE_SIGNAL_APP_ID
			ONE_SIGNAL_APP_AUTH_KEY = :ONE_SIGNAL_APP_AUTH_KEY
		end

		class OnesignalAction < Action
			def self.run(params)
				require 'net/http'
				require 'uri'
				require 'base64'

				UI.message("OneSignal App Name: #{params[:app_name]}")
				UI.message("OneSignal App ID: #{params[:app_id]}")
				auth_token = params[:auth_token]
				app_name = params[:app_name]
				app_id = params[:app_id]
				apns_p12_password = params[:apns_p12_password]
				android_token = params[:android_token]
				android_gcm_sender_id = params[:android_gcm_sender_id]

				payload = {}
				payload['name'] = app_name

				unless params[:apns_p12].nil?
					data = File.read(params[:apns_p12])
					apns_p12 = Base64.encode64(data)
					payload['apns_env'] = params[:apns_env]
					payload['apns_p12'] = apns_p12
					# we need to have something for the p12 password, even if it's an empty string
					payload['apns_p12_password'] = apns_p12_password || ''
				end

				payload['gcm_key'] = android_token unless android_token.nil?
				payload['android_gcm_sender_id'] = android_gcm_sender_id unless android_gcm_sender_id.nil?

				# here's the actual lifting - POST/PUT to OneSignal

				headers = {
					'Content-Type' => 'application/json',
					'Authorization' => "Basic #{auth_token}",
				}

				if app_id
					uri = URI.parse("https://onesignal.com/api/v1/apps/#{app_id}")
					http = Net::HTTP.new(uri.host, uri.port)
					http.use_ssl = true
					response = http.put(uri.path, payload.to_json, headers)
				else
					uri = URI.parse('https://onesignal.com/api/v1/apps')
					http = Net::HTTP.new(uri.host, uri.port)
					http.use_ssl = true
					response = http.post(uri.path, payload.to_json, headers)
				end

				case response.code.to_i
				when 200, 204
					response_body = JSON.parse(response.body)

					Actions.lane_context[SharedValues::ONE_SIGNAL_APP_ID] = response_body['id']
					Actions.lane_context[SharedValues::ONE_SIGNAL_APP_AUTH_KEY] = response_body['basic_auth_key']

					if app_id
						puts('Successfully updated OneSignal app'.green)
					else
						puts('Successfully created new OneSignal app'.green)
					end
				else
					UI.user_error!("Unexpected #{response.code} with response: #{response.body}")
				end
			end

			def self.description
				'Create a new OneSignal application'
			end

			def self.details
				'You can use this action to automatically create a OneSignal application. You can also upload a `.p12` with password, a GCM key, or both.'
			end

			def self.available_options
				[
				 FastlaneCore::ConfigItem.new(key: :auth_token,
				                              env_name: 'ONE_SIGNAL_AUTH_KEY',
				                              sensitive: true,
				                              description: 'OneSignal Authorization Key',
				                              verify_block: proc do |value|
					                              if value.to_s.empty?
						                              UI.error("Please add 'ENV[\"ONE_SIGNAL_AUTH_KEY\"] = \"your token\"' to your Fastfile's `before_all` section.")
						                              UI.user_error!('No ONE_SIGNAL_AUTH_KEY given.')
					                              end
				                              end),

				 FastlaneCore::ConfigItem.new(key: :app_name,
				                              env_name: 'ONE_SIGNAL_APP_NAME',
				                              description: 'OneSignal App Name',
				                              verify_block: proc do |value|
					                              if value.to_s.empty?
						                              UI.error("Please add 'ENV[\"ONE_SIGNAL_APP_NAME\"] = \"Your app name\"' to your Fastfile's `before_all` section.")
						                              UI.user_error!('No ONE_SIGNAL_APP_NAME given.')
					                              end
				                              end),

				 FastlaneCore::ConfigItem.new(key: :app_id,
				                              env_name: 'ONE_SIGNAL_APP_ID',
				                              description: 'Existing OneSignal App ID',
				                              optional: true,
				                              verify_block: proc do |value|
					                              if value.to_s.empty?
						                              UI.error("Please add 'ENV[\"ONE_SIGNAL_APP_ID\"] = \"Your existing OneSignal ID\"' to your Fastfile's `before_all` section.")
						                              UI.user_error!('No ONE_SIGNAL_APP_ID given.')
					                              end
				                              end),

				 FastlaneCore::ConfigItem.new(key: :android_token,
				                              env_name: 'ANDROID_TOKEN',
				                              description: 'ANDROID GCM KEY',
				                              sensitive: true,
				                              optional: true),

				 FastlaneCore::ConfigItem.new(key: :android_gcm_sender_id,
				                              env_name: 'ANDROID_GCM_SENDER_ID',
				                              description: 'GCM SENDER ID',
				                              sensitive: true,
				                              optional: true),

				 FastlaneCore::ConfigItem.new(key: :apns_p12,
				                              env_name: 'APNS_P12',
				                              description: 'APNS P12 File (in .p12 format)',
				                              optional: true),

				 FastlaneCore::ConfigItem.new(key: :apns_p12_password,
				                              env_name: 'APNS_P12_PASSWORD',
				                              sensitive: true,
				                              description: 'APNS P12 password',
				                              optional: true),

				 FastlaneCore::ConfigItem.new(key: :apns_env,
				                              env_name: 'APNS_ENV',
				                              description: 'APNS environment',
				                              optional: true,
				                              default_value: 'production'),
				]
			end

			def self.output
				[
				 ['ONE_SIGNAL_APP_ID', 'The OneSignal app ID of the newly created app'],
				 ['ONE_SIGNAL_APP_AUTH_KEY', 'The auth token for the newly created OneSignal app'],
				]
			end

			def self.authors
				%w[timothybarraclough smartshowltd hawkrives]
			end

			def self.is_supported?(platform)
				%i[ios android].include?(platform)
			end

			def self.example_code
				[
				 'onesignal(
            auth_token: "Your OneSignal Auth Token",
            app_name: "Name for new OneSignal App",
            app_id: "ID of an existing OneSignal App",
            android_token: "Your Android GCM key (optional)",
            android_gcm_sender_id: "Your Android GCM Sender ID (optional)",
            apns_p12: "Path to Apple .p12 file (optional)",
            apns_p12_password: "Password for .p12 file (optional)",
            apns_env: "production/sandbox (defaults to production)"
          )',
				]
			end

			def self.category
				:push
			end
		end
	end
end
