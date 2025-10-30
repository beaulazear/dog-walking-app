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
      email_address: user.email_address,
      thirty: user.thirty,
      fourty: user.fourty,
      sixty: user.sixty,
      solo_rate: user.solo_rate,
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
      email_address: user.email_address,
      thirty: user.thirty,
      fourty: user.fourty,
      sixty: user.sixty,
      solo_rate: user.solo_rate
    }
  end
end
