class StudentEnrollmentSynchronizer

  def self.synchronize!(synchronization, year)
    new(synchronization, year).synchronize!
  end

  def initialize(synchronization, year)
    self.synchronization = synchronization
    self.year = year
  end

  def synchronize!
    update_records api.fetch(ano: year)["matriculas"]
  end

  protected

  attr_accessor :synchronization, :year

  def api
    IeducarApi::StudentEnrollments.new(synchronization.to_api)
  end

  def update_records(collection)

    ActiveRecord::Base.transaction do
      collection.each do |record|

        if student_enrollment = student_enrollments.find_by(api_code: record["matricula_id"])
          update_existing_student_enrollment(record, student_enrollment)
        else
          create_new_student_enrollment(record)
        end

      end
    end
  end

  def student_enrollments(klass = StudentEnrollment)
    klass
  end

  def student_enrollment_classrooms(klass = StudentEnrollmentClassroom)
    klass
  end

  def create_new_student_enrollment(record)
    student_enrollment = student_enrollments.create(
      api_code: record["matricula_id"],
      status: record["situacao"],
      student_id: Student.find_by(api_code: record["aluno_id"]).try(:id),
      student_code: record["aluno_id"],
      changed_at: record["data_atualizacao"].to_s,
      dependence: record["dependencia"],
      active: record["ativo"]
    )

    if record["enturmacoes"].present?
      record["enturmacoes"].each do |record_classroom|
        student_enrollment.student_enrollment_classrooms.create(
          api_code: record_classroom["sequencial"],
          classroom_id: Classroom.find_by(api_code: record_classroom["turma_id"]).try(:id),
          classroom_code: record_classroom["turma_id"],
          joined_at: record_classroom["data_entrada"],
          left_at: record_classroom["data_saida"],
          changed_at: record_classroom["data_atualizacao"].to_s,
          sequence: record_classroom["sequencial_fechamento"]
        )
      end
    end
  end

  def update_existing_student_enrollment(record, student_enrollment)
    if record["data_atualizacao"].to_s > student_enrollment.changed_at.to_s
      student_enrollment.update(
        status: record["situacao"],
        student_id: Student.find_by(api_code: record["aluno_id"]).try(:id),
        student_code: record["aluno_id"],
        changed_at: record["data_atualizacao"].to_s,
        dependence: record["dependencia"],
        active: record["ativo"]
      )
    end

    if record["enturmacoes"].present?
      record["enturmacoes"].each do |record_classroom|
        if student_enrollment_classroom = student_enrollment.student_enrollment_classrooms.find_by(api_code: record_classroom["sequencial"])
          if record_classroom["data_atualizacao"].to_s > student_enrollment_classroom.changed_at.to_s
            student_enrollment_classroom.update(
              api_code: record_classroom["sequencial"],
              classroom_id: Classroom.find_by(api_code: record_classroom["turma_id"]).try(:id),
              classroom_code: record_classroom["turma_id"],
              joined_at: record_classroom["data_entrada"],
              left_at: record_classroom["data_saida"],
              changed_at: record_classroom["data_atualizacao"].to_s,
              sequence: record_classroom["sequencial_fechamento"]
            )
          end
        else
          student_enrollment.student_enrollment_classrooms.create(
            api_code: record_classroom["sequencial"],
            classroom_id: Classroom.find_by(api_code: record_classroom["turma_id"]).try(:id),
            classroom_code: record_classroom["turma_id"],
            joined_at: record_classroom["data_entrada"],
            left_at: record_classroom["data_saida"],
            changed_at: record_classroom["data_atualizacao"].to_s,
            sequence: record_classroom["sequencial_fechamento"]
          )
        end
      end
    end
  end
end
