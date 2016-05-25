$(function(){
	ExecuteOrDelayUntilScriptLoaded(taskManager, 'sp.js');
	SP.SOD.loadMultiple(['sp.js','clientpeoplepicker.js','datepicker.js','jquery-2.2.3.min.js','clienttemplates.js','clientforms.js','autofill.js','sp.runtime.js'], taskManager);
});
function taskManager() {
	$('#filtersDiv > button').click(function(){
		$(this).toggleClass('active');
	});
	
	/* var initializeDatePickers = function () { 
	var calendarOptions = [];
	calendarOptions.push(_spPageContextInfo.webServerRelativeUrl + '/' + _spPageContextInfo.layoutsUrl + '/iframe.aspx?');
	calendarOptions.push('&cal=1');
	calendarOptions.push('&lcid=1033');
	calendarOptions.push('&langid=1033');
	calendarOptions.push('&tz=-08:00:00.0002046');
	calendarOptions.push('&ww=0111110');
	calendarOptions.push('&fdow=0');
	calendarOptions.push('&fwoy=0');
	calendarOptions.push('&hj=0');
	calendarOptions.push('&swn=false');
	calendarOptions.push('&minjday=109207');
	calendarOptions.push('&maxjday=2666269');
	calendarOptions.push('&date=');

	$('[field-type="DateTime"]').each(function (index) {
		var id = $(this).attr('id');

		$(this).after('<iframe id="' + id + 'DatePickerFrame" title="Select a date from the calendar." style="display:none; position:absolute; width:200px; z-index:101;" src="/_layouts/15/images/blank.gif?rev=23"></iframe>');
		$(this).after('<a href="#" style="vertical-align:top;"><img id="' + id + 'DatePickerImage" border="0" alt="Select a date from the calendar." src="/_layouts/15/images/calendar_25.gif?rev=23"></a>');
		$(this).next('a').attr('onclick', 'clickDatePicker("' + id + '", "' + calendarOptions.join('') + '", '', event); return false;');
	});
}; */
	
	$.ajax({
		url: "/OSA/_api/web/lists/getbytitle('Список проектов')/items?$select=Title,ID",
		method: "GET",
		headers: {
			"accept": "application/json;odata=verbose"
		},
	}).success(function(data) {
		console.log(data);
		var selectProjectBody;
		
		for (var i in data.d.results){
			var projectId = data.d.results[i].ID;
			var projectTitle = data.d.results[i].Title;
			
			selectProjectBody+= '<option value="'+ projectId +'">' + projectTitle + '</option>'
		}
		$('#ProjectName').append(selectProjectBody);
		$('#ProjectName2').append(selectProjectBody);
	});
	
	var PPDExecutor = 'peoplePickerDivExecutor',
		PPDManager = 'peoplePickerDivManager',
		PPDManagerFilter = 'peoplePickerDivManagerFilter',
		PPDExecutorFilter = 'peoplePickerDivExecutorFilter';
	initializePeoplePicker(PPDExecutor);
	initializePeoplePicker(PPDManager);
	initializePeoplePicker(PPDManagerFilter);
	initializePeoplePicker(PPDExecutorFilter);
	
	function initializePeoplePicker(peoplePickerElementId) {

		// Create a schema to store picker properties, and set the properties.
		var schema = {};
		schema['PrincipalAccountType'] = 'User,DL,SecGroup,SPGroup';
		schema['SearchPrincipalSource'] = 15;
		schema['ResolvePrincipalSource'] = 15;
		schema['AllowMultipleValues'] = true;
		schema['MaximumEntitySuggestions'] = 50;
		schema['Width'] = '412px';

		// Render and initialize the picker. 
		// Pass the ID of the DOM element that contains the picker, an array of initial
		// PickerEntity objects to set the picker value, and a schema that defines
		// picker properties.
		SPClientPeoplePicker_InitStandaloneControlWrapper(peoplePickerElementId, null, schema);
	}
	
	// Query the picker for user information.
	$('#getUserBut').on('click', function(){
		getUserInfo(PPDExecutor);
		getUserInfo(PPDManager);
	})
	function getUserInfo(divID) {
		// Get the people picker object from the page.
		var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict[divID+'_TopSpan'];
		// Get information about all users.
		var users = peoplePicker.GetAllUserInfo();
		for (var i = 0; i < users.length; i++) {
			getUserId(users[i].Key, divID);
		}
	}

	// Get the user ID.
	function getUserId(loginName, divID) {
		var context = new SP.ClientContext.get_current();
		var user = context.get_web().ensureUser(loginName);
		context.load(user);
		context.executeQueryAsync(
			 function(){
				 switch (divID){
					 case PPDExecutor :
					 newTaskObject.AssignedToId.results.push(user.get_id());
					 break;
					 case PPDManager :
					 newTaskObject.ProjectManagerId = user.get_id();
					 break;
					 case PPDManagerFilter :
					 filteredQueryObj.ProjectManagerId = user.get_id();
					 break;
					 case PPDExecutorFilter :
					 filteredQueryObj.AssignedToId = user.get_id();
					 break;
				 }
				 console.log(newTaskObject);				 
			 }, 
			 function(sender, args) {
				console.log('Query failed. Error: ' + args.get_message());
			 }
		);
	}
	
	var filteredQueryObj = {};
	
	$('#filtersDiv > button').click(getFilteredTasks());
	
	/* $('#addTaskButton').click(function () {
		$('#newTaskContent').slideToggle('500', 'swing');
		$('.sp-peoplepicker-initialHelpText').html('Введите имя или адрес электронной почты...');
		$(this).val(clickedAddTaskButton? "Создать новую задачу": "Скрыть");
		clickedAddTaskButton = !clickedAddTaskButton;
	}); */
	
	function getFilteredTasks(){
		filteredQueryObj.ProjectManagerId = 0;
		filteredQueryObj.AssignedToId = 0;
		var buttonProject = 0;
		$('#filtersDiv > button').filter( ".active" ).each(function(){
			var objVal = $(this).html();
			switch (objVal){
				case 'Руководитель' :
				getUserInfo(PPDManagerFilter);
				break;
				case 'Исполнитель' :
				getUserInfo(PPDExecutorFilter);
				break;
				case 'Проект' :
				buttonProject = parseInt($('#ProjectNameFilter').find(':selected').val());
				break;
			}
			console.log('getFilteredTasks exec');
		});
		
		url = "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items?$filter=ProjectNameId eq " +  buttonProject;
		console.log('WTF??')
		/* filteredQueryObj.ProjectManagerId,filteredQueryObj.AssignedToId,buttonProject
			mngID,exID,prjID */
		getTasks(url);
	}
	
	getTasks("/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items");
	
	function getTasks(url){
		$.ajax({
			url: url,
			method: "GET",
			headers: {
				"accept": "application/json;odata=verbose"
			},
		}).success(function(data) {
			console.log(data);
			$('.taskDiv > ul').empty()
			for (var i in data.d.results){
				var taskId = data.d.results[i].ID;
				var taskTitle = data.d.results[i].Title;
				var taskStatus = data.d.results[i].Status;
				var taskBody = '<li class="taskLi" data-id="'+taskId+'" data-status="'+taskStatus+'">' +
									'<div class="deleteDiv">' +
										'<span class="deleteButton delete">x</span>' +
										'<span class="confirmDelete" style="display: none">' +
											'Are you sure?' +
											'<span class="yesDeleteButton delete">Yes</span>' +
											'<span class="noDeleteButton delete">No</span>' +
										'</span>' +
									'</div>' +
									'<p class="taskTitle">'+taskTitle+'</p>' +
									'<div class="taskDetailDiv" data-id="'+taskId+'" data-status="'+taskStatus+'">' +
										'<div class="taskDescriptionDiv" data-id="'+taskId+'" data-status="'+taskStatus+'"></div>' +
										'<div class="taskSubtaskDiv" data-id="'+taskId+'" data-status="'+taskStatus+'"></div>' +
									'</div>' +
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
	}
	$('#taskContent').delegate('p.taskTitle','click',function(e){
		var currentItem = $(e.target.nextSibling);
		if (currentItem.siblings('div.editDiv').length){
			if (currentItem.siblings('div.editDiv').is(':visible')){
				currentItem.hide()
				return;
			}
		}
		if(currentItem.is(":visible")){
			currentItem.hide();
		} else{
			currentItem.show();
			var guid = currentItem.attr('data-id');
			$.ajax({
				url: "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items("+guid+")",
				method: "GET",
				headers: {
				"accept": "application/json;odata=verbose"
				},
			}).success(function(item){
				currentItem.children('div.taskDescriptionDiv').html(item.d.Body);
				currentItem.children('div.taskSubtaskDiv').html(readSubTasks(item.d.subTasks,guid));
				if (!currentItem.children('div.moveButtonsDiv').length){
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
				}
			});
		}	
	});
	function readSubTasks(str,taskId) {
		var checkValid = false;
		try {
			var parsedStr = jQuery.parseJSON(str);
			if (parsedStr != undefined && parsedStr != null && typeof(parsedStr) == 'object') {
				checkValid = true;
			} else {
				checkValid = false;
			}
		} catch (e) {
			checkValid = false;
		}
		var returnStr = '<ul>';
		console.log('parset subTasks: '+parsedStr);
		currentOpenSubtasks.push({taskId: taskId, subTasks: parsedStr});
		console.log(currentOpenSubtasks);
		if (checkValid) {
			parsedStr = parsedStr.subTasks;
			for (var i in parsedStr) {
				var j = parseInt(i) + 1;
				returnStr += '<li' + (parsedStr[i].Status ? ' style="text-decoration: line-through"' : '') + '>' + j + '.' + parsedStr[i].Title + '</li>';
			}
		} else {
			returnStr += '<li>No subtasks</li>';
		}
		return returnStr + '</ul>';
	}

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
			url: "/OSA/_api/web/lists/GetByTitle('Задачи сотрудников')/Items("+taskId+")/recycle()",
			method: "POST",
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
	var clickedAddTaskButton = false;
	$('#addTaskButton').click(function () {
		$('#newTaskContent').slideToggle('500', 'swing');
		$('.sp-peoplepicker-initialHelpText').html('Введите имя или адрес электронной почты...');
		$(this).val(clickedAddTaskButton? "Создать новую задачу": "Скрыть");
		clickedAddTaskButton = !clickedAddTaskButton;
	});
	/* $('#addTaskButton').click(function () {
		var title = $('#newTaskTitle').val();
		if (title == '') {
			alert('Please enter a value');
			$('#newTaskTitle').focus();
		} else {
			AddNewTask(title);
		}
	}); */
	/* $("#newTaskTitle").keydown(function (e) {
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
	}); */
	var newTaskObject = {};
	newTaskObject.AssignedToId = {};
	newTaskObject.AssignedToId.results = [];
	$('#SaveAddTaskButton').click(function () {
		var title = $('#newTaskTitle').val();
		if (title == '') {
			alert('Please enter a value');
			$('#newTaskTitle').focus();
		}
		var description = $('#addNewTaskDescription').html();
		var project = parseInt($('#ProjectName').find(':selected').val());
		console.log(description);
	});
	function AddNewTask(title,deadline,executors,manager,description,project){
			var data = {
				__metadata: { 'type': 'SP.Data.ProjectTasksListItem'},
				Title: title,
				StartDate: new Date().toISOString(),
				AssignedToId: { 'results': executors},
				ProjectManagerId: manager,
				ProjectNameId: project,
				Body: description,
				
				
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
	/* $('#taskContent').delegate('li','dblclick',function(){
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
		
	}); */
	$('#taskContent').delegate('.taskLi','dblclick',function(){
		var taskElement = $(this);
		console.log(taskElement);
		
		/* var currentItem = $(e.target.nextSibling);
		if (currentItem.siblings('div.editDiv').length){
			if (currentItem.siblings('div.editDiv').is(':visible')){
				return;
			}
		}#inProgressTasksDiv > ul > li:nth-child(1)
		//*[@id="inProgressTasksDiv"]/ul/li[1]
		'div>div>ul>li'
		if(currentItem.is(":visible"))
			currentItem.hide(); */
		
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
			'<div class="editSubTasks"></div>' +
			'<span class="editTaskSaveButton editButton">Save</span>' +
			'<span class="editTaskCancelButton editButton">Cancel</span>' +
			'</div>';
			taskElement.append(editDiv);
			var title = taskElement.find('p.taskTitle').text();
			var description = taskElement.find('div.taskDescriptionDiv').html();
			taskElement.find('input.editTaskTitle').val(title);
			taskElement.find('textarea.editTaskDescription').val(description);
			
			inspectSubtasks(searchSubtasks(taskElement),taskElement.find('.editSubTasks')); 
		}
		taskElement.children('div.taskDetailDiv').hide();
	});
	$('#taskContent').delegate('.editTaskCancelButton','click',function(){
		var taskElement = $(this).parents("li:first");
		taskElement.children('div.editDiv').hide();
		taskElement.children('div.taskDetailDiv').show();
	});
	$('#taskContent').delegate('.editTaskSaveButton','click',function(){
		UpdateTask(this);
	});
	var currentOpenSubtasks = [];
	function searchSubtasks(taskElement){
		var subtasks = null;
		for(var i in currentOpenSubtasks)
			if(currentOpenSubtasks[i].taskId == taskElement.attr('data-id'))
				subtasks = i;
		return subtasks;
	}
	function inspectSubtasks(o,selector){
		if(currentOpenSubtasks[o].subTasks == null){
			currentOpenSubtasks[o].subTasks = undefined;
		}
		function generateNewTask(o){
			return {
			ID: (o.length+1),
			Status: false,
			Title: ''
		  }
		}
		function searchSubtask(sid){
			var id = 0;
			for(var i in currentOpenSubtasks[o].subTasks)
				if(currentOpenSubtasks[o].subTasks[i].ID == sid)
					id = i;
			return id;	
		}
		console.log(currentOpenSubtasks[o].subTasks);
		if(typeof(currentOpenSubtasks[o].subTasks) != "undefined"){
			for(var i in currentOpenSubtasks[o].subTasks)
			selector.append('<li data-id="'+currentOpenSubtasks[o].subTasks[i].ID+'"><input type="checkbox" '+(currentOpenSubtasks[o].subTasks[i].Status?'checked':'')+'/><span>'+currentOpenSubtasks[o].subTasks[i].Title+'</span></li>');
		}
		else{
		  var nt = generateNewTask([]);
		  currentOpenSubtasks[o].subTasks = [];
		  currentOpenSubtasks[o].subTasks.push(nt);
		  console.log(currentOpenSubtasks[o].subTasks);
		  selector.append('<li data-id="'+nt.ID+'"><input type="checkbox" '+(nt.Status?'checked':'')+'/><input type="text" value="'+nt.Title+'" /></li>');
		}
		selector.delegate('input[type="checkbox"]','click',function(){
			var par = $(this).parent();
			currentOpenSubtasks[o].subTasks[searchSubtask(par.attr('data-id'))].Status = par.find('input[type="checkbox"]').is(':checked');
			console.log(currentOpenSubtasks[o].subTasks[searchSubtask(par.attr('data-id'))]);
		});
		selector.delegate('span','click',function(){
			var par = $(this).parent();
			$(this).replaceWith('<input type="text" value="'+$(this).text()+'">');
			par.find('input[type="text"]').focus();
		});
		selector.delegate('input[type="text"]','focusout',function(){
			if($(this).val() != ''){
				var par = $(this).parent();
				currentOpenSubtasks[o].subTasks[searchSubtask(parseInt(par.attr('data-id')))] = {
					ID: parseInt(par.attr('data-id')),
					Title: $(this).val(),
					Status: par.find('input[type="checkbox"]').is(':checked')
				}
				$(this).replaceWith('<span>'+$(this).val()+'</span>');
				par.find('input[type="text"]').focus();
			}
		});
		selector.delegate('input','keydown',function(e){
			console.log(selector);
			if(e.keyCode == 13){
				var nt = generateNewTask(currentOpenSubtasks[o].subTasks);
				currentOpenSubtasks[o].subTasks.push(nt);
				$(this).parent().after('<li data-id="'+nt.ID+'"><input type="checkbox" '+(nt.Status?'checked':'')+'/><input type="text" value="'+nt.Title+'" /></li>');
				var par = $(this).parent();
				par.next().find('input[type="text"]').focus();
				e.preventDefault ? e.preventDefault() : e.returnValue = false;
				return false;
			}
		});
	}	
	function UpdateTask(taskElement) {
		var taskElement = $(taskElement).parents("li.taskLi");
		var taskTitleElement = taskElement.find('input.editTaskTitle');
		var updatedTitle = taskTitleElement.val();
		if (updatedTitle == '') {
			alert('Please enter a value for the task title');
			taskTitleElement.focus();
			return;
		}
		var updatedDescription = taskElement.find('textarea.editTaskDescription').val();
		var updatedDescription = taskElement.find('textarea.editTaskDescription').val();
		var updatedSubtask = JSON.stringify(currentOpenSubtasks[searchSubtasks($(taskElement))]);
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
				'Body': updatedDescription,
				'subTasks': updatedSubtask
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