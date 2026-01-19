class PetSerializer
  def self.serialize(pet)
    result = {
      id: pet.id,
      name: pet.name,
      birthdate: pet.birthdate,
      sex: pet.sex,
      spayed_neutered: pet.spayed_neutered,
      address: pet.address,
      behavioral_notes: pet.behavioral_notes,
      supplies_location: pet.supplies_location,
      allergies: pet.allergies,
      active: pet.active,
      latitude: pet.latitude,
      longitude: pet.longitude,
      geocoded: pet.geocoded?,
      geocoded_at: pet.geocoded_at,
      geocoding_failed: pet.geocoding_failed,
      geocoding_error: pet.geocoding_error,
      client_id: pet.client_id
    }

    # Include client information if pet has a client
    if pet.client.present?
      result[:client] = {
        id: pet.client.id,
        first_name: pet.client.first_name,
        last_name: pet.client.last_name,
        full_name: pet.client.full_name,
        email: pet.client.email,
        phone_number: pet.client.phone_number
      }
    end

    result
  end

  def self.serialize_collection(pets)
    pets.map { |pet| serialize(pet) }
  end
end
