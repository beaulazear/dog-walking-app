class PetSerializer
  def self.serialize(pet)
    {
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
      geocoding_error: pet.geocoding_error
    }
  end

  def self.serialize_collection(pets)
    pets.map { |pet| serialize(pet) }
  end
end
