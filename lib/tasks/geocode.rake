namespace :geocode do
  desc 'Geocode all pets with addresses but no coordinates'
  task pets: :environment do
    pets = Pet.where(latitude: nil).where.not(address: nil)

    puts "Found #{pets.count} pets to geocode..."

    success_count = 0
    failed_count = 0

    pets.find_each.with_index do |pet, index|
      print "\rGeocoding pet #{index + 1}/#{pets.count}: #{pet.name}..."

      pet.geocode!

      if pet.geocoded?
        success_count += 1
      else
        failed_count += 1
        puts "\n  ⚠️  Failed to geocode #{pet.name}: #{pet.geocoding_error}"
      end

      # Be nice to Nominatim API - rate limit 1 request/second
      sleep(1.1) unless index == pets.count - 1
    end

    puts "\n"
    puts '=' * 60
    puts 'Geocoding Complete!'
    puts '=' * 60
    puts "✓ Successfully geocoded: #{success_count} pets"
    puts "✗ Failed: #{failed_count} pets"
    puts "Total with coordinates: #{Pet.where.not(latitude: nil).count}"
    puts '=' * 60
  end

  desc 'Re-geocode all pets (including those already geocoded)'
  task all: :environment do
    pets = Pet.where.not(address: nil)

    puts "Re-geocoding ALL #{pets.count} pets..."

    success_count = 0
    failed_count = 0

    pets.find_each.with_index do |pet, index|
      print "\rGeocoding pet #{index + 1}/#{pets.count}: #{pet.name}..."

      pet.geocode!

      if pet.geocoded?
        success_count += 1
      else
        failed_count += 1
        puts "\n  ⚠️  Failed to geocode #{pet.name}: #{pet.geocoding_error}"
      end

      # Rate limit
      sleep(1.1) unless index == pets.count - 1
    end

    puts "\n"
    puts '=' * 60
    puts 'Geocoding Complete!'
    puts '=' * 60
    puts "✓ Successfully geocoded: #{success_count} pets"
    puts "✗ Failed: #{failed_count} pets"
    puts '=' * 60
  end

  desc 'Retry failed geocoding attempts'
  task retry_failed: :environment do
    pets = Pet.where(geocoding_failed: true)

    puts "Retrying #{pets.count} failed pets..."

    success_count = 0
    still_failed_count = 0

    pets.find_each.with_index do |pet, index|
      print "\rRetrying pet #{index + 1}/#{pets.count}: #{pet.name}..."

      pet.geocode!

      if pet.geocoded?
        success_count += 1
      else
        still_failed_count += 1
        puts "\n  ⚠️  Still failed: #{pet.name}: #{pet.geocoding_error}"
      end

      # Rate limit
      sleep(1.1) unless index == pets.count - 1
    end

    puts "\n"
    puts '=' * 60
    puts 'Retry Complete!'
    puts '=' * 60
    puts "✓ Now successful: #{success_count} pets"
    puts "✗ Still failed: #{still_failed_count} pets"
    puts '=' * 60
  end

  desc 'Show geocoding statistics'
  task stats: :environment do
    total_pets = Pet.count
    geocoded_pets = Pet.where.not(latitude: nil).count
    failed_pets = Pet.where(geocoding_failed: true).count
    pending_pets = Pet.where(latitude: nil, geocoding_failed: false).where.not(address: nil).count

    puts '=' * 60
    puts 'Geocoding Statistics'
    puts '=' * 60
    puts "Total pets: #{total_pets}"
    puts "Successfully geocoded: #{geocoded_pets} (#{(geocoded_pets.to_f / total_pets * 100).round(1)}%)"
    puts "Failed geocoding: #{failed_pets}"
    puts "Pending geocoding: #{pending_pets}"
    puts "No address: #{Pet.where(address: nil).count}"
    puts '=' * 60

    if failed_pets.positive?
      puts "\nFailed Pets:"
      Pet.where(geocoding_failed: true).limit(10).each do |pet|
        puts "  - #{pet.name}: #{pet.geocoding_error}"
      end
      puts "  ... and #{failed_pets - 10} more" if failed_pets > 10
    end
  end
end
