$(function(){
	ExecuteOrDelayUntilScriptLoaded(taskManager, 'sp.js');
});
function taskManager() {
	initializePeoplePicker('peoplePickerDiv');
	
	function initializePeoplePicker(peoplePickerElementId) {

		// Create a schema to store picker properties, and set the properties.
		var schema = {};
		schema['PrincipalAccountType'] = 'User,DL,SecGroup,SPGroup';
		schema['SearchPrincipalSource'] = 15;
		schema['ResolvePrincipalSource'] = 15;
		schema['AllowMultipleValues'] = true;
		schema['MaximumEntitySuggestions'] = 50;
		schema['Width'] = '280px';

		// Render and initialize the picker. 
		// Pass the ID of the DOM element that contains the picker, an array of initial
		// PickerEntity objects to set the picker value, and a schema that defines
		// picker properties.
		this.SPClientPeoplePicker_InitStandaloneControlWrapper(peoplePickerElementId, null, schema);
	}

	// Query the picker for user information.
	$('#getUserBut').on('click', getUserInfo);
	function getUserInfo() {

		// Get the people picker object from the page.
		var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;

		// Get information about all users.
		var users = peoplePicker.GetAllUserInfo();
		var userInfo = '';
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			for (var userProperty in user) { 
				userInfo += userProperty + ':  ' + user[userProperty] + '<br>';
			}
		}
		$('#resolvedUsers').html(userInfo);

		// Get user keys.
		var keys = peoplePicker.GetAllUserKeys();
		$('#userKeys').html(keys);

		// Get the first user's ID by using the login name.
		getUserId(users[0].Key);
	}

	// Get the user ID.
	function getUserId(loginName) {
		var context = new SP.ClientContext.get_current();
		this.user = context.get_web().ensureUser(loginName);
		context.load(this.user);
		context.executeQueryAsync(
			 Function.createDelegate(null, ensureUserSuccess), 
			 Function.createDelegate(null, onFail)
		);
	}

	function ensureUserSuccess() {
		$('#userId').html(this.user.get_id());
	}

	function onFail(sender, args) {
		alert('Query failed. Error: ' + args.get_message());
	}
	
	$.ajax({
		url: "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items",
		method: "GET",
		headers: {
			"accept": "application/json;odata=verbose"
		},
	}).success(function(data) {
		console.log(data);
		for (var i in data.d.results){
			var taskId = data.d.results[i].ID;
			var taskTitle = data.d.results[i].Title;
			var taskStatus = data.d.results[i].Status;
			var taskBody = '<li data-id="'+taskId+'" data-status="'+taskStatus+'">' +
								'<div class="deleteDiv">' +
									'<span class="deleteButton delete">x</span>' +
									'<span class="confirmDelete" style="display: none">' +
										'Are you sure?' +
										'<span class="yesDeleteButton delete">Yes</span>' +
										'<span class="noDeleteButton delete">No</span>' +
									'</span>' +
								'</div>' +
								'<p class="taskTitle">'+taskTitle+'</p>' +
								'<div class="taskDetailDiv" data-id="'+taskId+'" data-status="'+taskStatus+'"></div>' +
							'</li>';
			switch (taskStatus){
				case "Не начата" : 
				$('#notStartedTasksDiv>ul').append(taskBody);
				break;
				case "В процессе выполнения" : 
				$('#inProgressTasksDiv>ul').append(taskBody);
				break;
				case "Завершена" : 
				$('#completedTasksDiv>ul').append(taskBody);
				break;
			}
		}
	});
	$('#taskContent').delegate('p.taskTitle','click',function(e){
		var currentItem = $(e.target.nextSibling);
		if (currentItem.siblings('div.editDiv').length){
			if (currentItem.find('div.editDiv').is(':visible')){
				return;
			}
		}
		if(currentItem.is(":visible"))
			currentItem.hide();
		else{
			var guid = currentItem.attr('data-id');
			$.ajax({
				url: "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items("+guid+")",
				method: "GET",
				headers: {
				"accept": "application/json;odata=verbose"
				},
			}).success(function(item){
				currentItem.html(item.d.Body);
				var taskButton = '<div class="moveButtonsDiv">' +
									'<img class="moveLeftButton moveButton" src="/_layouts/images/ARRLEFTA.GIF" alt="Move Left" />' +
									'<img class="moveRightButton moveButton" src="/_layouts/images/ARRRIGHTA.GIF" alt="Move Right" />' +
								'</div>';
				currentItem.append(taskButton).show();
				switch (item.d.Status) {
					case "Не начата": currentItem.find('.moveLeftButton').hide();
						break;
					case "Завершена": currentItem.find('.moveRightButton').hide();
						break;
				}
			});
		}	
	});
	$('#taskContent').delegate('.moveButton','click',function(e){
		var $currentItem = $(e.target);
		var taskStatus = $currentItem.closest('div[class^="taskDetailDiv"]').data('status');
		var taskId = $currentItem.closest('div[class^="taskDetailDiv"]').data('id');
		if ($currentItem.hasClass('moveRightButton')) {
			if (taskStatus == 'Не начата'){
				taskStatus = 'В процессе выполнения';
			} else if (taskStatus == 'В процессе выполнения'){
				taskStatus = 'Завершена';
			}
		} else if ($currentItem.hasClass('moveLeftButton')) {
			if (taskStatus == 'В процессе выполнения'){
				taskStatus = 'Не начата';
			} else if (taskStatus == 'Завершена'){
				taskStatus = 'В процессе выполнения';
			}
		}
		$.ajax({
			url: "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items(" + taskId + ")",
			method: "POST",
			headers: {
				"Accept": "application/json;odata=verbose",
				"X-RequestDigest": $("#__REQUESTDIGEST").val(),
				"content-Type": "application/json;odata=verbose",
				"X-HTTP-Method": "MERGE",
				"If-Match": "*"
			},
			data: JSON.stringify({
				'__metadata': {
					'type': 'SP.Data.ProjectTasksListItem'
				},
				'Status': taskStatus
		}),
		success: function(data) {
			var $newTask = $currentItem.closest('li').clone();
			$currentItem.closest('li').remove();
			$newTask.attr('data-status', taskStatus);
			$newTask.children('div').attr('data-status', taskStatus);
			switch (taskStatus) {
				case "Не начата":
					$newTask.find('.moveLeftButton').hide();
					$('#notStartedTasksDiv>ul').prepend($newTask);
					break;
				case "В процессе выполнения":
					$newTask.find('.moveLeftButton').show();
					$newTask.find('.moveRightButton').show();
					$('#inProgressTasksDiv>ul').prepend($newTask);
					break;
				case "Завершена":
					$newTask.find('.moveRightButton').hide();
					$('#completedTasksDiv>ul').prepend($newTask);
					break;
			}
		},
		error: function(error) {
				alert(JSON.stringify(error));
			}
		});
	});
	function deleteTask(taskElement) {
		var TasksItemElement = $(taskElement).parents('li:first');
		var taskId = TasksItemElement.data('id');
		$.ajax({
			url: "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items("+taskId+")",
			method: "DELETE",
			headers: {
				"accept": "application/json;odata=verbose",
				"X-RequestDigest": $("#__REQUESTDIGEST").val(),
				"IF-MATCH": "*"
			},
		}).success(function(item){
			TasksItemElement.remove();
		}).error(function(sender, error){
			alert('Error: '+ JSON.stringify(error));
			alert('Request failed. ' + error.get_message() + '\n' + error.get_stackTrace()); 
		});
	}
	$('#addTaskButton').click(function () {
		var title = $('#newTaskTitle').val();
		if (title == '') {
			alert('Please enter a value');
			$('#newTaskTitle').focus();
		} else {
			AddNewTask(title);
		}
	});
	$("#newTaskTitle").keydown(function (e) {
		switch (e.keyCode) {
			// Handle the Enter button to call button click
			case 13:
				$('#addTaskButton').click();
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				return false;
				break;
			// Handle the ESC key press to clear value
			case 27:
				$(this).val('');
				break;
		}
	});
	function AddNewTask(Title){
			var data = {
				__metadata: { 'type': 'SP.Data.ProjectTasksListItem'},
				Title: Title,
				StartDate: new Date().toISOString()
			};
		$.ajax({
			url: "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items",
			method: "POST",
			headers: {
				"Accept": "application/json;odata=verbose",
				"X-RequestDigest": $("#__REQUESTDIGEST").val(),
				"content-Type": "application/json;odata=verbose"
			},
			data: JSON.stringify(data)
		}).success(function(data) {
			var taskTitle = data.d.Title;
			var taskId = data.d.ID;
			var taskStatus = data.d.Status;
			var taskBody = '<li data-id="'+taskId+'" data-status="'+taskStatus+'">' +
									'<div class="deleteDiv">' +
										'<span class="deleteButton delete">x</span>' +
										'<span class="confirmDelete" style="display: none">' +
											'Are you sure?' +
											'<span class="yesDeleteButton delete">Yes</span>' +
											'<span class="noDeleteButton delete">No</span>' +
										'</span>' +
									'</div>' +
									'<p class="taskTitle">'+taskTitle+'</p>' +
									'<div class="taskDetailDiv" data-id="'+taskId+'" data-status="'+taskStatus+'"></div>' +
								'</li>';
			$('#notStartedTasksDiv>ul').prepend(taskBody);
		}).error(function(e){
			alert('Error: '+ JSON.stringify(error));
			alert('Request failed. ' + error.get_message() + '\n' + error.get_stackTrace()); 
		});
	}
	$('#taskContent').delegate('.deleteButton','click',function(){
		$(this).siblings('.confirmDelete').show();
		$(this).hide();
	});
	$('#taskContent').delegate('.noDeleteButton','click',function(){
		$(this).parent('.confirmDelete').hide();
		$(this).parent().siblings('.deleteButton').show();
	});
	$('#taskContent').delegate('.yesDeleteButton','click',function(){
		deleteTask(this);
	});
	$('#taskContent').delegate('li','dblclick',function(){
		var taskElement = $(this);
		console.log(taskElement);
		taskElement.children('div.taskDetailDiv').hide();
		if (taskElement.find('div.editDiv').length){
			if(taskElement.find('div.editDiv').is(':visible')){
				return;
			} else {
				taskElement.find('div.editDiv').show();
			}
		} else {
			var editDiv = '<div class="editDiv" style="display: block">' +
			'<p>' +
				'<input class="editTaskTitle edit" type="text" maxlength="50" />' +
			'</p>' +
			'<p>' +
				'<textarea class="editTaskDescription edit" rows="4" cols="30">' +
				'</textarea>' +
			'</p>' +
			'<span class="editTaskSaveButton editButton">Save</span>' +
			'<span class="editTaskCancelButton editButton">Cancel</span>' +
			'</div>';
			taskElement.append(editDiv);
			var title = taskElement.find('p.taskTitle').text();
			var description = taskElement.find('div.taskDetailDiv').text();
			taskElement.find('input.editTaskTitle').val(title);
			taskElement.find('textarea.editTaskDescription').text(description);
		}
		
	});
	$('#taskContent').delegate('.editTaskCancelButton','click',function(){
		var taskElement = $(this).parents("li:first");
		taskElement.children('div.editDiv').hide();
		taskElement.children('div.taskDetailDiv').show();
	});
	$('#taskContent').delegate('.editTaskSaveButton','click',function(){
		UpdateTask(this);
	});
	function UpdateTask(taskElement) {
		var taskElement = $(taskElement).parents("li:first");
		console.log(taskElement);
		var taskTitleElement = taskElement.find('input.editTaskTitle');
		var updatedTitle = taskTitleElement.val();
		if (updatedTitle == '') {
			alert('Please enter a value for the task title');
			taskTitleElement.focus();
			return;
		}
		var updatedDescription = taskElement.find('textarea.editTaskDescription').val();
		var taskId = taskElement.data('id');
		$.ajax({
			url: "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items(" + taskId + ")",
			method: "POST",
			headers: {
				"Accept": "application/json;odata=verbose",
				"X-RequestDigest": $("#__REQUESTDIGEST").val(),
				"content-Type": "application/json;odata=verbose",
				"X-HTTP-Method": "MERGE",
				"If-Match": "*"
			},
			data: JSON.stringify({
				'__metadata': {
					'type': 'SP.Data.ProjectTasksListItem'
				},
				'Title': updatedTitle,
				'Body': updatedDescription
		}),
		success: function() {
			taskElement.find('div.editDiv').hide();
			taskElement.find('p.taskTitle').html(updatedTitle);
			var butDiv = taskElement.find('div.moveButtonsDiv');
			taskElement.find('div.taskDetailDiv').html(updatedDescription);
			butDiv.appendTo('div.taskDetailDiv');
			taskElement.find('div.taskDetailDiv').show();
		},
		error: function(error) {
				alert(JSON.stringify(error));
			}
		});
	}
	
};