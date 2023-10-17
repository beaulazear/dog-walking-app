class PetSerializer < ActiveModel::Serializer
  attributes :id, :name, :birthdate, :sex, :spayed_neutered, :address, :behavorial_notes, :supplies_location, :allergies, :profile_pic

  has_one :user
  has_many :appointments
  has_many :invoices

  def profile_pic
    if object.profile_pic.attached?
      Rails.application.routes.url_helpers.rails_blob_path(object.profile_pic, only_path: true)
    else
      'https://cdn3.iconfinder.com/data/icons/essential-rounded/64/Rounded-31-1024.png'
    end
  end
end
