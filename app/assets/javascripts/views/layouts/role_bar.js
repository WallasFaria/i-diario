$(function() {
   "use strict";

  var role_unity_id = null;
  var can_change_school_year = false;
  var flashMessages = new FlashMessages();

  function fetchTeachers(unity_id, year){
    var filter = { by_unity_id: unity_id, by_year: year };
    unity_id = String(unity_id);

    if(!_.isEmpty(unity_id) && !_.isEmpty(year)){
      $.ajax({
        url: Routes.teachers_pt_br_path({
            filter: filter,
            format: 'json'
        }),
        success: handleFetchTeachersSuccess,
        error: handleFetchTeachersError
      });
    } else {
      handleFetchTeachersSuccess([]);
    }
  }

  function handleFetchTeachersSuccess(data){
    var selectedTeachers = _.map(data, function(teacher) {
      return { id: teacher['id'], text: teacher['name'] };
    });

    insertEmptyElement(selectedTeachers);
    $('form#user-role-form #user_assumed_teacher_id').select2({ formatResult: function(el) {
                                                    return "<div class='select2-user-result'>" + el.text + "</div>";
                                                  },
                                    data: selectedTeachers });
    if(_.isNull($('form#user-role-form #user_assumed_teacher_id').select2("data"))){
      $('form#user-role-form #user_assumed_teacher_id').val("");
      $('#classroom-field-container').hide();
      $('#discipline-field-container').hide();
    }
  }

  function handleFetchTeachersError(){
    flashMessages.error('Ocorreu um erro ao buscar os professores da unidade selecionada.');
  }

  function fetchYears(unity_id, callback){
    callback = callback || function(){};
    unity_id = String(unity_id);
     if(!_.isEmpty(unity_id)){
      $.ajax({
        url: Routes.years_from_unity_school_calendars_pt_br_path({
            unity_id: unity_id,
            format: 'json'
        }),
        success: function(data){
          handleFetchYearsSuccess(data, callback);
        },
        error: handleFetchYearsError
      });
    }
  }

  function handleFetchYearsSuccess(data, callback){
    var selectedYears = _.map(data.school_calendars, function(year) {
      return { id: year['id'], text: year['name'] };
    });
     insertEmptyElement(selectedYears);
    $('form#user-role-form #user_current_school_year').select2({ formatResult: function(el) {
                                                    return "<div class='select2-user-result'>" + el.text + "</div>";
                                                  },
                                    data: selectedYears });
     if (selectedYears.length > 1 && !can_change_school_year) {
      $('form#user-role-form #user_current_school_year').select2('val', selectedYears[1]['id']);
    }
    callback();
  }
   function handleFetchYearsError(){
    flashMessages.error('Ocorreu um erro ao buscar os anos letivos da unidade selecionada.');
  }

  function checkUnityType(unity_id){

    var filter = { by_unity_id: unity_id };
    unity_id = String(unity_id);

    if(!_.isEmpty(unity_id)){
      $.getJSON(Routes.unities_pt_br_path() + "/"+unity_id, function(data){
        if(data && data.unit_type == "school_unit"){
          if (can_change_school_year) {
            $('#school-year-field-container').show();
          }
          $('#assumed-teacher-field-container').show();
          fetchTeachers(unity_id, $('form#user-role-form #user_current_school_year').val());
        }else{
          $('#assumed-teacher-field-container').hide();
          $('#school-year-field-container').hide();
        }
      });
    }
  }

  function fetchClassroomsByTeacherAndUnityAndYear(teacher_id, unity_id, year){
    unity_id = String(unity_id);
    teacher_id = String(teacher_id);
    year = String(year);

    var filter = { by_teacher_id: teacher_id, by_unity: unity_id, by_year: year };
    if(!_.isEmpty(teacher_id) && !_.isEmpty(unity_id) && !_.isEmpty(year)){
      $.ajax({
        url: Routes.classrooms_pt_br_path({
            filter: filter,
            format: 'json'
        }),
        success: handleFetchClassroomsSuccess,
        error: handleFetchClassroomsError
      });
    }
  }

  function handleFetchClassroomsSuccess(data){
    var selectedClassrooms = _.map(data, function(classroom) {
      return { id: classroom['id'], text: classroom['description'] };
    });

    if(_.isEmpty(selectedClassrooms)){
      $('form#user-role-form #user_current_classroom_id').val("");
    }

    insertEmptyElement(selectedClassrooms);
    $('form#user-role-form #user_current_classroom_id').select2({ formatResult: function(el) {
                                                              return "<div class='select2-user-result'>" + el.text + "</div>";
                                                            },
                                              data: selectedClassrooms });
    fetchDisciplines();
  }

  function handleFetchClassroomsError(){
    flashMessages.error('Ocorreu um erro ao buscar as turmas do professor selecionado.');
  }

  function fetchUnities(){
    $.ajax({
      url: Routes.search_unities_pt_br_path({
          format: 'json',
          per: 9999999
      }),
      success: handleFetchUnitiesSuccess,
      error: handleFetchUnitiessError
    });

  }

  function handleFetchUnitiesSuccess(data){
    var selectedUnities = _.map(data.unities, function(unity) {
      return { id: unity['id'], text: unity['name'] };
    });

    if(_.isEmpty(selectedUnities)){
      $('form#user-role-form #user_current_unity_id').val("");
    }

    insertEmptyElement(selectedUnities);
    $('form#user-role-form #user_current_unity_id').select2({ formatResult: function(el) {
                                                          return "<div class='select2-user-result'>" + el.text + "</div>";
                                                        },
                                          data: selectedUnities });
  }

  function handleFetchUnitiessError(){
    flashMessages.error('Ocorreu um erro ao buscar as escolas.');
  }

  $('form#user-role-form #user_current_user_role_id').on('change', function(){

    var user_role_id = $(this).val();

    if(_.isEmpty(user_role_id)){
      $('#no-role-selected-alert').removeClass('hidden');
    }else{
      $('#no-role-selected-alert').addClass('hidden');
    }

    if(valueSelected($(this))){
      $.ajax({
        url: Routes.user_role_pt_br_path( user_role_id, {
            format: 'json'
        }),
        success: handleFetchRoleSuccess,
        error: handleFetchRoleError
      });
    }else{
      toggleNoProfileSelectedFields();
    }

    function handleFetchRoleSuccess(data){
      role_unity_id = null;
      can_change_school_year = data.user_role.can_change_school_year;
      switch (data.user_role.role.access_level) {
        case 'administrator':
          toggleAdministratorFields();
          break;

        case 'employee':
          toggleEmployeeFields(data.user_role.unity_id);
          role_unity_id = data.user_role.unity_id;
          break;

        case 'teacher':
          toggleTeacherFields(data.user_role.unity_id);
          role_unity_id = data.user_role.unity_id;
          break;

        case 'parent':
        case 'student':
          toggleParentAndStudentFields();
          break;
      }
    }

    function handleFetchRoleError(){
      flashMessages.error('Ocorreu um erro ao buscar o nível de acesso da permissão selecionada.');
    }
  });

  $('form#user-role-form #user_current_unity_id').on('change', function(){
    $('#assumed-teacher-field-container').hide();
    $('#classroom-field-container').hide();
    $('#discipline-field-container').hide();

    var unity_id = $(this).val();

    var emptyElements = insertEmptyElement([]);

    $('form#user-role-form #user_assumed_teacher_id').select2("data", emptyElements);
    $('form#user-role-form #user_current_classroom_id').select2("data", emptyElements);
    $('form#user-role-form #user_current_discipline_id').select2("data", emptyElements);
    checkUnityType(unity_id);
    fetchYears(unity_id);
  });

  $('form#user-role-form #user_current_school_year').on('change', function () {
    var emptyElements = insertEmptyElement([]);
    $('form#user-role-form #user_assumed_teacher_id').select2("data", emptyElements);
    $('form#user-role-form #user_current_classroom_id').select2("data", emptyElements);
    $('form#user-role-form #user_current_discipline_id').select2("data", emptyElements);
    fetchTeachers($('form#user-role-form #user_current_unity_id').val(), $('#current_school_year').val());
    checkUnityType($('form#user-role-form #user_current_unity_id').val());
    if (role_unity_id) {
      fetchClassroomsByTeacherAndUnityAndYear($('form#user-role-form #user_teacher_id').val(), role_unity_id, $('form#user-role-form #user_current_school_year').val());
    }
  });

  $('form#user-role-form #user_assumed_teacher_id').on('change', function(){
    var teacher_id = $(this).val();

    if(valueSelected($(this))){
      $('#classroom-field-container').show();
      $('#discipline-field-container').show();
      var unity_id = role_unity_id ? role_unity_id : $("form#user-role-form #user_current_unity_id").val();
      fetchClassroomsByTeacherAndUnityAndYear(teacher_id, unity_id, $('form#user-role-form #user_current_school_year').val());
    }else{
      $("form#user-role-form #user_current_classroom_id").val('');
      $("form#user-role-form #user_current_discipline_id").val('');
      $('#classroom-field-container').hide();
      $('#discipline-field-container').hide();
    }
  });

  $('form#user-role-form #user_current_classroom_id').on('change', fetchDisciplines);

  function fetchDisciplines(){
    var classroom_id = $("form#user-role-form #user_current_classroom_id").val();
    var filter = { by_classroom: classroom_id };
    var params = {
      filter: filter,
      format: 'json'
    }

    if($("#assumed-teacher-field-container").is(":visible") ||
          (!$("formform#user-role-form #user-role").is(":visible") && $("form#user-role-form #user_assumed_teacher_id").val().length ) ){
      filter.by_teacher_id = $("form#user-role-form #user_assumed_teacher_id").val();
    }else{
      params.use_user_teacher = true;
    }

    if(!_.isEmpty(classroom_id)){
      $.ajax({
        url: Routes.search_disciplines_pt_br_path(params),
        success: handleFetchDisciplinesSuccess,
        error: handleFetchDisciplinesError
      });
    }else{
      var selectedDisciplines = [];
      insertEmptyElement(selectedDisciplines);
      $('form#user-role-form #user_current_discipline_id').select2({ formatResult: function(el) {
                                                                  return "<div class='select2-user-result'>" + el.text + "</div>";
                                                               },
                                                 data: selectedDisciplines });
    }
  }

  function handleFetchDisciplinesSuccess(data){
    var selectedDisciplines = _.map(data.disciplines, function(discipline) {
      return { id: discipline['id'], text: discipline['description'] };
    });

    if(_.isEmpty(selectedDisciplines)){
      $('form#user-role-form #user_current_discipline_id').val("");
    }

    insertEmptyElement(selectedDisciplines);
    $('form#user-role-form #user_current_discipline_id').select2({ formatResult: function(el) {
                                                                return "<div class='select2-user-result'>" + el.text + "</div>";
                                                             },
                                               data: selectedDisciplines });
  }

  function handleFetchDisciplinesError(){
    flashMessages.error('Ocorreu um erro ao buscar as disciplinas da turma selecionada.');
  }

  // Togglers
  function toggleNoProfileSelectedFields(){

    $("form#user-role-form #user_current_teacher_id").val('');
    $("form#user-role-form #user_current_unity_id").val('');
    $("form#user-role-form #user_current_classroom_id").val('');
    $("form#user-role-form #user_current_discipline_id").val('');
    $("form#user-role-form #user_current_school_year").val('');

    $('#assumed-teacher-field-container').hide();
    $('#unity-field-container').hide();
    $('#classroom-field-container').hide();
    $('#discipline-field-container').hide();
    $('#school-year-field-container').hide();
  }

  function toggleAdministratorFields(){
    $('#classroom-field-container').hide();
    $('#discipline-field-container').hide();
    $('#assumed-teacher-field-container').hide();

    $('#unity-field-container').show();

    fetchUnities();
    if(valueSelected($('form#user-role-form #user_current_unity_id'))){
      if (can_change_school_year) {
        $('#school-year-field').show();
      }
      $('#assumed-teacher-field-container').show();
      fetchYears($('form#user-role-form #user_current_unity_id').val(), function(){
        fetchTeachers($('form#user-role-form #user_current_unity_id').val(), $('form#user-role-form #user_current_school_year').val());
        checkUnityType($('form#user-role-form #user_current_unity_id').val());

        if(valueSelected($('form#user-role-form #user_assumed_teacher_id'))){
          $('#discipline-field-container').show();
          $('#classroom-field-container').show();
          fetchClassroomsByTeacherAndUnityAndYear($('form#user-role-form #user_assumed_teacher_id').val(), $('form#user-role-form #user_current_unity_id').val(), $('form#user-role-form #user_current_school_year').val());
        }
      });
    }
  }

  function toggleEmployeeFields(unity_id){
    $('#unity-field-container').hide();
    $('#classroom-field-container').hide();
    $('#discipline-field-container').hide();
    $('#school-year-field-container').hide();
    $('#assumed-teacher-field-container').hide();

    $("form#user-role-form #user_assumed_teacher_id").select2('val', '');
    $("form#user-role-form #user_current_unity_id").select2('val', '');
    $("form#user-role-form #user_current_classroom_id").select2('val', '');
    $("form#user-role-form #user_current_discipline_id").select2('val', '');
    $("form#user-role-form #school-year-field-container").select2('val', '');

    $("form#user-role-form #user_current_unity_id").val('');

    checkUnityType(unity_id);

    fetchYears(unity_id, function(){
      fetchTeachers(unity_id, $('form#user-role-form #user_current_school_year').val());

      if(valueSelected($('form#user-role-form #user_assumed_teacher_id'))){
        $('#discipline-field-container').show();
        $('#classroom-field-container').show();
        fetchClassroomsByTeacherAndUnityAndYear($('form#user-role-form #user_assumed_teacher_id').val(), unity_id, $('form#user-role-form #user_current_school_year').val());
      }
    });
  }

  function toggleTeacherFields(unity_id){
    $('#unity-field-container').hide();
    $('#assumed-teacher-field-container').hide();
    if (can_change_school_year) {
      $('#school-year-field-container').show();
    }

    $("form#user-role-form #user_assumed_teacher_id").val('');
    $("form#user-role-form #user_current_unity_id").val('');

    $('#classroom-field-container').show();
    $('#discipline-field-container').show();

    fetchYears(unity_id, function(){
      fetchClassroomsByTeacherAndUnityAndYear($('form#user-role-form #user_teacher_id').val(), unity_id, $('form#user-role #user_current_school_year').val());
    });
  }

  function toggleParentAndStudentFields(){
    $("form#user-role-form #user_current_teacher_id").val('');
    $("form#user-role-form #user_current_unity_id").val('');

    $('#classroom-field-container').hide();
    $('#discipline-field-container').hide();
    $('#unity-field-container').hide();
    $('#assumed-teacher-field-container').hide();
    $('#school-year-field-container').hide();
  }

  function insertEmptyElement(elementArray){
    if(!_.isEmpty(elementArray)){
      elementArray.unshift({ id: "empty", text: "<option></option>" });
    }
  }

  function valueSelected(select2Element){
    return !(_.isEmpty(select2Element.val()) || select2Element.val() == 0);
  }
  $('#user-role-form').on('ajax:success', location.reload.bind(location));
  $('#user-role-form').on('ajax:send', function(){
    $('#page-loading').removeClass('hidden');
  });
  $('#user-role-form').on('ajax:error', function(event, request){
    $('#page-loading').addClass('hidden');
    var invalidFields = request.responseJSON||{};
    if (invalidFields['current_user_role_id'] !== undefined) {
      alert('É necessário selecionar um perfil para continuar a navegação');
    } else if(invalidFields['current_unity_id'] !== undefined) {
      alert('É necessário selecionar uma unidade para continuar a navegação');
    } else if(invalidFields['current_classroom_id'] !== undefined) {
      alert('É necessário selecionar uma turma e disciplina para continuar a navegação');
    } else if(invalidFields['current_discipline_id'] !== undefined) {
      alert('É necessário selecionar uma disciplina para continuar a navegação');
    } else {
      alert('Erro desconhecido');
    }
  });

  $('#header input.select2').on('select2-open', function(){
    $('.select2-search:visible').attr('style', 'margin-top: 5px;');
  });
});
