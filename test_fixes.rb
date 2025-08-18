#!/usr/bin/env ruby
# Test script to verify the appointment and cancellation fixes

require 'net/http'
require 'json'
require 'uri'

puts "Testing Dog Walking App Fixes"
puts "=" * 40

# Test 1: Check if Rails API is running
begin
  uri = URI('http://localhost:3000/me')
  response = Net::HTTP.get_response(uri)
  if response.code == '401'
    puts "✓ Rails API is running (got expected 401 for unauthorized request)"
  else
    puts "✗ Unexpected response from Rails API: #{response.code}"
  end
rescue => e
  puts "✗ Rails API not accessible: #{e.message}"
end

# Test 2: Check if React app is running
begin
  uri = URI('http://localhost:4000')
  response = Net::HTTP.get_response(uri)
  if response.code == '200' && response.body.include?('PocketWalks')
    puts "✓ React app is running"
  else
    puts "✗ React app not accessible or unexpected content"
  end
rescue => e
  puts "✗ React app not accessible: #{e.message}"
end

# Test 3: Check database for appointments with day fields
begin
  result = `bundle exec rails runner "apt = Appointment.where(recurring: true).first; puts apt ? 'Has days: ' + [:monday,:tuesday,:wednesday,:thursday,:friday,:saturday,:sunday].map{|d| apt.send(d).nil? ? 'nil' : 'ok'}.join(',') : 'No recurring appointments'" 2>/dev/null`
  if result.include?('Has days:') && result.include?('ok')
    puts "✓ Database has recurring appointments with day fields"
  else
    puts "✗ Issue with recurring appointments: #{result}"
  end
rescue => e
  puts "✗ Database check failed: #{e.message}"
end

puts "\n" + "=" * 40
puts "Key Fixes Applied:"
puts "1. PetsPage.js line 817: Added !! to handle undefined day values"
puts "2. CancellationModal: Fixed prop passing and modal control"
puts "3. Both components should now work without crashing"
puts "\nTo fully test:"
puts "1. Open http://localhost:4000 in your browser"
puts "2. Log in with a test account"
puts "3. Navigate to Pets page"
puts "4. Try editing a recurring appointment's days"
puts "5. Try adding a cancellation to a recurring appointment"