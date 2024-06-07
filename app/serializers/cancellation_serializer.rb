class CancellationSerializer < ActiveModel::Serializer
  attributes :id, :date
  belongs_to :appointment
end
