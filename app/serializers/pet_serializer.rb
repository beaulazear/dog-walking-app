class PetSerializer < ActiveModel::Serializer
  attributes :id, :name, :birthdate, :sex, :spayed_neutered, :address, :behavorial_notes, :supplies_location, :allergies

  has_one :user
  has_many :appointments
end
