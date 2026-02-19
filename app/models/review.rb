class Review < ApplicationRecord
  belongs_to :cleanup_job
  belongs_to :reviewer, class_name: "User"
  belongs_to :scooper, class_name: "User"

  validates :rating, inclusion: { in: 1..5 }
  validates :cleanup_job_id, uniqueness: true # one review per job
end
