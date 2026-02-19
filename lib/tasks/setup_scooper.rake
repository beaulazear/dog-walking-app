namespace :scoop do
  desc "Set up Beau as a scooper and create test blocks"
  task setup_test_data: :environment do
    puts "🔧 Setting up Scoop test data..."

    # 1. Make Beau a scooper
    user = User.find_by(username: "beaulazear")
    if user
      user.update!(is_scooper: true)
      puts "✅ Updated #{user.name} (#{user.username}) to scooper"
    else
      puts "❌ User 'beaulazear' not found"
      exit 1
    end

    # 2. Create test blocks in NYC (around your area)
    puts "\n📍 Creating test blocks..."

    blocks_data = [
      {
        block_id: "WEST_VILLAGE_1",
        neighborhood: "West Village",
        borough: "Manhattan",
        # West Village block coordinates (polygon)
        coordinates: [
          [-74.0060, 40.7350],
          [-74.0050, 40.7350],
          [-74.0050, 40.7340],
          [-74.0060, 40.7340],
          [-74.0060, 40.7350]
        ]
      },
      {
        block_id: "CHELSEA_1",
        neighborhood: "Chelsea",
        borough: "Manhattan",
        coordinates: [
          [-74.0020, 40.7470],
          [-74.0010, 40.7470],
          [-74.0010, 40.7460],
          [-74.0020, 40.7460],
          [-74.0020, 40.7470]
        ]
      },
      {
        block_id: "SOHO_1",
        neighborhood: "SoHo",
        borough: "Manhattan",
        coordinates: [
          [-74.0030, 40.7230],
          [-74.0020, 40.7230],
          [-74.0020, 40.7220],
          [-74.0030, 40.7220],
          [-74.0030, 40.7230]
        ]
      }
    ]

    blocks_data.each do |data|
      block = Block.find_or_initialize_by(block_id: data[:block_id])

      # Create GeoJSON polygon
      geojson = {
        type: "Polygon",
        coordinates: [data[:coordinates]]
      }

      block.assign_attributes(
        neighborhood: data[:neighborhood],
        borough: data[:borough],
        geojson: geojson,
        status: "inactive"  # inactive = unclaimed/available
      )

      if block.save
        puts "  ✅ Created block: #{data[:block_id]} (#{data[:neighborhood]})"
      else
        puts "  ❌ Failed to create #{data[:block_id]}: #{block.errors.full_messages.join(', ')}"
      end
    end

    puts "\n✨ Setup complete!"
    puts "📊 Total blocks: #{Block.count}"
    puts "👤 Scoopers: #{User.where(is_scooper: true).count}"
  end
end
