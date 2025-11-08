#!/usr/bin/env bash
# exit on error
set -o errexit

# builds the front end code
rm -rf public
npm install --prefix client && npm run build --prefix client
cp -a client/build/. public/

gem install nokogiri --platform=ruby
bundle install

bundle exec rake db:migrate

# Seed default books only if they don't exist (prevents duplicates on redeployment)
bundle exec rails runner "Book.defaults.any? || load(Rails.root.join('db', 'seeds', 'books_seed.rb'))"
