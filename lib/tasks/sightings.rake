namespace :sightings do
  desc "Expire old sightings (run every 15 minutes)"
  task expire: :environment do
    count = SightingExpirationJob.perform_now
    puts "✅ Expired #{count} sightings"
  end
end
