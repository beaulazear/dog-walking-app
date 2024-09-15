class PetSerializer < ActiveModel::Serializer
  attributes :active, :id, :name, :birthdate, :sex, :spayed_neutered, :address, :behavorial_notes, :supplies_location, :allergies, :profile_pic

  has_one :user
  has_many :appointments
  has_many :invoices
  has_many :additional_incomes

  def profile_pic
    if object.profile_pic.attached?
      Rails.application.routes.url_helpers.rails_blob_path(object.profile_pic, only_path: true)
    else
      'https://cdn4.iconfinder.com/data/icons/dog-breed-minimal-outline/512/Border_collie-512.png'
    end
  end
end

