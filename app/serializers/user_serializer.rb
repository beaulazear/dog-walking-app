class UserSerializer
  def self.serialize(user)
    # Eager load all associations in a single optimized query
    pets = user.pets.includes(:appointments, :client)
    appointments = user.appointments.includes(:cancellations, :pet)
    pet_sits = user.pet_sits.includes(:pet, :pet_sit_completions)
    training_sessions = user.training_sessions.includes(:pet)
    pet_ids = pets.pluck(:id)
    invoices = Invoice.where(pet_id: pet_ids)

    {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email_address,
      email_address: user.email_address,
      thirty: user.thirty,
      fortyfive: user.fortyfive,
      sixty: user.sixty,
      solo_rate: user.solo_rate,
      training_rate: user.training_rate,
      sibling_rate: user.sibling_rate,
      pet_sitting_rate: user.pet_sitting_rate,
      profile_pic_url: user.profile_pic_url,
      admin: user.admin,
      custom_pin: user.custom_pin,
      created_at: user.created_at,
      # App separation fields (Scoopers vs Pocket Walks)
      uses_pocket_walks: user.uses_pocket_walks,
      uses_scoopers: user.uses_scoopers,
      registered_from_app: user.registered_from_app,
      # Role flags
      is_scooper: user.is_scooper,
      is_poster: user.is_poster,
      is_dog_walker: user.is_dog_walker,
      user_type: user.user_type,
      # Dog walker specific fields
      business_name: user.business_name,
      instagram_handle: user.instagram_handle,
      neighborhoods: user.neighborhoods,
      # Scooper stats
      overall_rating: user.overall_rating,
      total_pickups: user.total_pickups,
      total_scooper_earnings: user.total_scooper_earnings,
      total_lifetime_pickups: user.total_lifetime_pickups,
      current_streak_days: user.current_streak_days,
      longest_streak_days: user.longest_streak_days,
      # Stripe Connect
      stripe_connect_onboarded: user.stripe_connect_onboarded,
      # Pocket Walks associations
      pets: PetSerializer.serialize_collection(pets),
      appointments: AppointmentSerializer.serialize_collection(appointments),
      pet_sits: pet_sits.as_json(include: { pet: {}, pet_sit_completions: {} }),
      training_sessions: training_sessions.as_json(include: { pet: { only: %i[id name] } }),
      invoices: invoices.as_json(only: %i[id appointment_id pet_sit_id pet_id date_completed
                                          compensation paid pending title cancelled])
    }
  end

  def self.serialize_basic(user)
    {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email_address,
      email_address: user.email_address,
      thirty: user.thirty,
      fortyfive: user.fortyfive,
      sixty: user.sixty,
      solo_rate: user.solo_rate,
      training_rate: user.training_rate,
      sibling_rate: user.sibling_rate,
      pet_sitting_rate: user.pet_sitting_rate,
      profile_pic_url: user.profile_pic_url,
      admin: user.admin,
      custom_pin: user.custom_pin,
      created_at: user.created_at,
      # App separation fields (Scoopers vs Pocket Walks)
      uses_pocket_walks: user.uses_pocket_walks,
      uses_scoopers: user.uses_scoopers,
      registered_from_app: user.registered_from_app,
      # Role flags
      is_scooper: user.is_scooper,
      is_poster: user.is_poster,
      is_dog_walker: user.is_dog_walker,
      user_type: user.user_type,
      # Dog walker specific fields
      business_name: user.business_name,
      instagram_handle: user.instagram_handle,
      neighborhoods: user.neighborhoods,
      # Scooper stats
      overall_rating: user.overall_rating,
      total_pickups: user.total_pickups,
      total_scooper_earnings: user.total_scooper_earnings,
      total_lifetime_pickups: user.total_lifetime_pickups,
      current_streak_days: user.current_streak_days,
      longest_streak_days: user.longest_streak_days,
      # Stripe Connect
      stripe_connect_onboarded: user.stripe_connect_onboarded
    }
  end
end
