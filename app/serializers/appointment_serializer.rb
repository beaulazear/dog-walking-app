class AppointmentSerializer < ActiveModel::Serializer
  attributes :id, :pet_id, :recurring, :appointment_date, :start_time, :end_time, :duration, :price, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday, :completed, :canceled
  
  has_one :user
  has_one :pet
end
