class WalkGroupingService
  MAX_GROUP_SIZE = 5
  DEFAULT_MAX_DISTANCE = 0.5 # miles
  DEFAULT_BUFFER_MINUTES = 15

  # Find groupable walks and return suggestions
  def self.suggest_groups(appointments, max_distance: DEFAULT_MAX_DISTANCE, max_group_size: MAX_GROUP_SIZE)
    # Only process geocoded appointments
    groupable = appointments.select { |a| a.pet&.geocoded? && groupable_walk_type?(a) }

    return [] if groupable.empty?

    suggestions = []
    processed = Set.new

    groupable.each_with_index do |base_appt, idx|
      next if processed.include?(base_appt.id)

      group = [ base_appt ]
      processed.add(base_appt.id)

      # Find nearby compatible walks
      groupable.each_with_index do |candidate, cidx|
        next if cidx <= idx || processed.include?(candidate.id)
        next if group.length >= max_group_size

        # Check if within distance
        distance = DistanceCalculator.distance_between(
          base_appt.pet.latitude, base_appt.pet.longitude,
          candidate.pet.latitude, candidate.pet.longitude
        )

        next unless distance <= max_distance

        # Check time compatibility
        next unless time_compatible?(base_appt, candidate)

        # Check walk type compatibility
        next unless walk_type_compatible?(base_appt, candidate)

        group << candidate
        processed.add(candidate.id)
      end

      # Only suggest groups with 2+ walks
      suggestions << format_group_suggestion(group, max_distance) if group.length > 1
    end

    suggestions.sort_by { |s| -s[:estimated_savings] }
  end

  # Check if two appointments have compatible times
  def self.time_compatible?(appt1, appt2, buffer_minutes: DEFAULT_BUFFER_MINUTES)
    return false unless appt1.start_time && appt2.start_time

    start1 = parse_time(appt1.start_time)
    start2 = parse_time(appt2.start_time)

    return false unless start1 && start2

    # Calculate end times based on duration
    duration1 = appt1.duration || 30
    duration2 = appt2.duration || 30

    end1 = start1 + duration1.minutes
    end2 = start2 + duration2.minutes

    # Check if times overlap or are within buffer
    times_overlap?(start1, end1, start2, end2, buffer_minutes)
  end

  # Check if walk types can be grouped together
  # Solo and training walks are always solo
  def self.walk_type_compatible?(appt1, appt2)
    type1 = appt1.walk_type&.downcase
    type2 = appt2.walk_type&.downcase

    # Solo and training walks cannot be grouped
    return false if %w[solo training].include?(type1)
    return false if %w[solo training].include?(type2)

    # Group walks can be grouped together
    true
  end

  # Check if a walk type is groupable at all
  def self.groupable_walk_type?(appointment)
    type = appointment.walk_type&.downcase
    !%w[solo training].include?(type)
  end

  def self.parse_time(time_value)
    return nil unless time_value

    case time_value
    when Time, DateTime, ActiveSupport::TimeWithZone
      time_value
    when String
      begin
        Time.parse(time_value)
      rescue StandardError
        nil
      end
    end
  end

  def self.times_overlap?(start1, end1, start2, end2, buffer_minutes)
    buffer = buffer_minutes.minutes

    # Check if time windows overlap or are close enough
    (start1 <= end2 + buffer) && (end1 + buffer >= start2)
  end

  def self.format_group_suggestion(appointments, _max_distance)
    # Calculate total distance between all points
    total_distance = calculate_group_distance(appointments)

    # Calculate estimated time for the group walk
    total_duration = appointments.sum { |a| a.duration || 30 }
    travel_time = (total_distance / 3.0 * 60).round # Assuming 3 mph walking speed
    estimated_time = total_duration + travel_time

    # Calculate savings compared to individual walks
    individual_time = appointments.sum { |a| a.duration || 30 }
    estimated_savings = individual_time - estimated_time

    # Get pet details
    pets = appointments.map do |appt|
      {
        id: appt.pet.id,
        name: appt.pet.name,
        address: appt.pet.address,
        latitude: appt.pet.latitude,
        longitude: appt.pet.longitude
      }
    end

    {
      appointments: appointments.map(&:id),
      pets: pets,
      total_distance: total_distance.round(2),
      estimated_time: estimated_time,
      estimated_savings: estimated_savings,
      group_size: appointments.length,
      walk_type: appointments.first.walk_type
    }
  end

  def self.calculate_group_distance(appointments)
    return 0 if appointments.length < 2

    total = 0
    appointments.each_cons(2) do |appt1, appt2|
      total += DistanceCalculator.distance_between(
        appt1.pet.latitude, appt1.pet.longitude,
        appt2.pet.latitude, appt2.pet.longitude
      )
    end
    total
  end
end
