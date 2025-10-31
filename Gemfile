source 'https://rubygems.org'

# Use the latest Rails version
gem 'rails', '~> 7.2.2'

# Use PostgreSQL as the database for Active Record
gem 'pg', '~> 1.1'

# Use Puma as the app server
gem 'puma', '>= 5.0'

# Use Active Model has_secure_password
gem 'bcrypt', '~> 3.1.7'

# The original asset pipeline for Rails
gem 'sprockets-rails'

# Use JavaScript with ESM import maps
gem 'importmap-rails'

# Hotwire's SPA-like page accelerator
gem 'turbo-rails'

# Hotwire's modest JavaScript framework
gem 'stimulus-rails'

# Enable Cross-Origin Resource Sharing (CORS)
gem 'rack-cors', require: 'rack/cors'

# AWS SDK for Active Storage
gem 'aws-sdk-s3'

# Environment variables management
gem 'dotenv-rails', groups: %i[development test]

# Pagination
gem 'kaminari', '~> 1.2'

# Reduces boot times through caching
gem 'bootsnap', require: false

# Time zone support for Windows
gem 'tzinfo-data', platforms: %i[mswin mswin64 mingw jruby]

# Development & Test Group
group :development, :test do
  # Debugging
  gem 'debug', platforms: %i[mri windows], require: 'debug/prelude'

  # Security scanner
  gem 'brakeman', require: false

  # Ruby styling for Rails projects
  gem 'rubocop-rails-omakase', require: false

  # RSpec testing framework
  gem 'rspec-rails', '~> 5.0.0'

  # Console debugging
  gem 'byebug', platforms: %i[mri mingw x64_mingw]
end

# Development Group
group :development do
  # Live reload
  gem 'listen', '~> 3.3'

  # Rails development speed boost
  gem 'spring'

  # Debugging in Rails console
  gem 'web-console'

  # N+1 query detection
  gem 'bullet'
end

# Test Group
group :test do
  # Feature/system testing
  gem 'capybara'
  gem 'selenium-webdriver'

  # JSON response testing
  gem 'rspec-json_expectations'

  # Matchers for RSpec
  gem 'shoulda-matchers', '~> 4.0'
end
gem 'faker', '~> 3.5'
