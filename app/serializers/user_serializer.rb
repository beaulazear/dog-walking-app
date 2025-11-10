class UserSerializer
  def self.serialize(user)
    # Eager load all associations in a single optimized query
    pets = user.pets.includes(:appointments)
    appointments = user.appointments.includes(:cancellations, :pet)
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
      profile_pic_url: user.profile_pic_url,
      created_at: user.created_at,
      pets: PetSerializer.serialize_collection(pets),
      appointments: AppointmentSerializer.serialize_collection(appointments),
      invoices: invoices.as_json(only: %i[id appointment_id pet_id date_completed
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
      profile_pic_url: user.profile_pic_url,
      created_at: user.created_at
    }
  end
end
