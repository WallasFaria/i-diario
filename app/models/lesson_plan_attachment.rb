class LessonPlanAttachment < ActiveRecord::Base
  belongs_to :lesson_plan

  has_attached_file :attachment,
                    url: "/:class/#{Entity.current.try(:name)}/:id/:basename.:extension",
                    path: "/:class/#{Entity.current.try(:name)}/:id/:basename.:extension"
  validates_attachment_file_name :attachment, matches: [/png\z/, /jpeg\z/, /jpg\z/, /gif\z/, /pdf\z/, /odt\z/,
                                                        /doc\z/, /docx\z/, /ods\z/, /xls\z/, /xlsx\z/, /odp\z/,
                                                        /ppt\z/, /pptx\z/, /odg\z/, /xml\z/, /csv\z/]
  validates_with AttachmentSizeValidator, attributes: :attachment, less_than: 512.kilobytes

  do_not_validate_attachment_file_type :attachment
end
