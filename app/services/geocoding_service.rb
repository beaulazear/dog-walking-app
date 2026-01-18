class GeocodingService
  require "net/http"
  require "json"
  require "uri"

  # Using Nominatim (OpenStreetMap) - FREE
  # Rate limit: 1 request per second
  # User-Agent required
  def self.geocode(address)
    return { success: false, error: "Address is blank" } if address.blank?

    begin
      # Normalize address for NYC context
      normalized_address = normalize_nyc_address(address)
      encoded_address = URI.encode_www_form_component(normalized_address)
      url = "https://nominatim.openstreetmap.org/search?q=#{encoded_address}&format=json&limit=1"
      uri = URI(url)

      # Nominatim requires a User-Agent header
      request = Net::HTTP::Get.new(uri)
      request["User-Agent"] = "DogWalkingApp/1.0"

      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
        http.request(request)
      end

      unless response.is_a?(Net::HTTPSuccess)
        return {
          success: false,
          error: "HTTP error: #{response.code}"
        }
      end

      results = JSON.parse(response.body)

      if results.any?
        {
          latitude: results.first["lat"].to_f,
          longitude: results.first["lon"].to_f,
          success: true
        }
      else
        {
          success: false,
          error: "Address not found"
        }
      end
    rescue JSON::ParserError => e
      {
        success: false,
        error: "JSON parsing error: #{e.message}"
      }
    rescue StandardError => e
      {
        success: false,
        error: e.message
      }
    end
  end

  # Alternative: Using Mapbox (requires API key in ENV)
  # Uncomment and use this if you upgrade to Mapbox
  def self.geocode_with_mapbox(address)
    return { success: false, error: "Address is blank" } if address.blank?
    return { success: false, error: "Mapbox API key not configured" } unless ENV["MAPBOX_API_KEY"]

    begin
      api_key = ENV["MAPBOX_API_KEY"]
      encoded_address = URI.encode_www_form_component(address)
      url = "https://api.mapbox.com/geocoding/v5/mapbox.places/#{encoded_address}.json?access_token=#{api_key}"
      uri = URI(url)

      response = Net::HTTP.get_response(uri)

      unless response.is_a?(Net::HTTPSuccess)
        return {
          success: false,
          error: "HTTP error: #{response.code}"
        }
      end

      data = JSON.parse(response.body)

      if data["features"]&.any?
        coordinates = data["features"].first["geometry"]["coordinates"]
        {
          longitude: coordinates[0].to_f,
          latitude: coordinates[1].to_f,
          success: true
        }
      else
        {
          success: false,
          error: "Address not found"
        }
      end
    rescue StandardError => e
      {
        success: false,
        error: e.message
      }
    end
  end

  # Alternative: Using Google Maps (requires API key in ENV)
  # Uncomment and use this if you upgrade to Google Maps
  def self.geocode_with_google(address)
    return { success: false, error: "Address is blank" } if address.blank?
    return { success: false, error: "Google Maps API key not configured" } unless ENV["GOOGLE_MAPS_API_KEY"]

    begin
      api_key = ENV["GOOGLE_MAPS_API_KEY"]
      encoded_address = URI.encode_www_form_component(address)
      url = "https://maps.googleapis.com/maps/api/geocode/json?address=#{encoded_address}&key=#{api_key}"
      uri = URI(url)

      response = Net::HTTP.get_response(uri)

      unless response.is_a?(Net::HTTPSuccess)
        return {
          success: false,
          error: "HTTP error: #{response.code}"
        }
      end

      data = JSON.parse(response.body)

      if data["status"] == "OK" && data["results"].any?
        location = data["results"].first["geometry"]["location"]
        {
          latitude: location["lat"].to_f,
          longitude: location["lng"].to_f,
          success: true
        }
      else
        {
          success: false,
          error: data["status"] || "Address not found"
        }
      end
    rescue StandardError => e
      {
        success: false,
        error: e.message
      }
    end
  end

  # Normalize addresses for NYC context
  # If address doesn't contain city/state info, append Brooklyn, NY
  def self.normalize_nyc_address(address)
    address = address.to_s.strip

    # Check if address already has location context
    has_context = address.match?(/\b(NY|New York|Brooklyn|Manhattan|Queens|Bronx|Staten Island)\b/i)

    return address if has_context

    # Append Brooklyn, NY as default for NYC area
    "#{address}, Brooklyn, NY"
  end
end
