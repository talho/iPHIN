var jQT = new $.jQTouch({
  icon:'images/txphin-icon.png',
  //addGlossToIcon: false,
  startupScreen:"images/startup.png",
  statusBar:'black-translucent',
  preloadImages:[
    'jqtouch/themes/jqt/img/back_button.png',
    'jqtouch/themes/jqt/img/back_button_clicked.png',
    'jqtouch/themes/jqt/img/button_clicked.png',
    'jqtouch/themes/jqt/img/grayButton.png',
    'jqtouch/themes/jqt/img/whiteButton.png',
    'images/loading.gif',
    'images/txphin-icon.png',
    'images/startup.png'
  ]
});

var DOMAIN = "http://localhost:3000"; /* "http://www.txphin.org" release */
//var DOMAIN = "http://192.168.1.44:3000"; /* "http://www.txphin.org" release */

function setCookie(data) {sessionStorage._cookie = data.cookie;}
function getCookie() {return sessionStorage._cookie;}

function setAlertDetail(data) {localStorage.alertDetail = data;}
function getAlertDetail() {return localStorage.alertDetail;}

function setRolesAge(age) {sessionStorage.rolesAge = age;}
function getRolesAge() {return sessionStorage.rolesAge||0 ;}

function getRoles() {return JSON.parse(localStorage.roles)||[];}
function setRoles(data) {
	if (data.roles.length>0) {
		localStorage.roles = JSON.stringify(data.roles);
		setRolesAge(data.latest_in_secs);
	}
}

function setJurisdictionsAge(age) {sessionStorage.jurisdictionsAge = age;}
function getJurisdictionsAge() {return sessionStorage.jurisdictionsAge||0 ;}

function getJurisdictions() {return JSON.parse(localStorage.jurisdictions)||[];}
function setJurisdictions(data) {
	if (data.jurisdictions.length>0) {
		localStorage.jurisdictions = JSON.stringify(data.jurisdictions);
		setJurisdictionsAge(data.latest_in_secs);
	}
}

function msg(message) {
	try {navigator.notification.alert(message,"TxPhin","OK");}
	catch (e) {alert(message);}
}

function showMessageBox(command, element){  //prepends a string in a box at the top of the named element.  
	hideMessageBox(); 
	var userMessage = '';
	switch(command){
		case 'loadingalerts':
			userMessage = '<li id="messageBox"><img src="images/loading.gif"> Loading latest alerts...</li>';
		break;
		case 'loadingsearch':
			userMessage = '<ul id="messageBox"><li><img src="images/loading.gif"> Searching...</li></ul>';
		break;
		case 'nosearch':
			userMessage = '<ul id="messageBox"><li>No results.  Click Search to try again.</li></ul>';
		break;
		case 'auth':
			userMessage = '<li id="messageBox"><img src="images/loading.gif"> Authenticating...</li>';
		break;
		case 'neterror':
			userMessage = '<li id="messageBox">Could not connect to server.</li>';
		break;
	}
	$(element).prepend(userMessage); 
}

function hideMessageBox(){
	$('#messageBox').remove();
}

$(document).ready(function() {
	
	if (typeof(PhoneGap) != 'undefined') {
	    $('body > *').css({minHeight: '460px !important'});
	}

	// SignIn 
	
	$('a#signin').click(function(event) {
		showMessageBox('auth', '#signin_fields');
		//$('#signin').hide();
		$.ajax({
		   type: "POST",
		   data: $('#signin_form').serialize(),
		   dataType: "json",
		   url: DOMAIN + "/session.json",
			//timeout: 10000,
			cache: false,
		   success: function(data) {
		   	 hideMessageBox();
		   	 //$('#signin').show();
				 setCookie(data);
				 jQT.goTo($('#alerts_pane'), 'flip')
			 },
		   error: function(xhr) {
		   	hideMessageBox();
		   	//$('#signin').show();
				switch (xhr.status) {
					case 401: msg("No user with this email and password."); break;
					case 0:   msg("No user with this email and password."); break;
					default: msg("Network error. (code: signin " + xhr.status + ")");
				}
			}
		});
		return false;
	});
	
	// Load the Alert previews

	$('#alerts_pane').bind('pageAnimationStart', function(event, info){
   	if (info.direction == 'in') fetchAlerts();
	});
	
	function populateAlertsPreviewPane(data){
		$('#alerts_preview').empty();
		for (var d in data){  //for each alert
			var alertPreviewString = '<li class="arrow"><a href="#alert_detail_pane" alert_id="' + d + '">';
			if (data[d].header && data[d].header.length > 0 ){
				alertPreviewString += '<p class="header">' + data[d].header + '</p>';
			}
			if (data[d].preview.pair){
				for (p in data[d].preview.pair){ //for each pair in the alert 
					alertPreviewString += '<p class="pair">' + 
						data[d].preview.pair[p].key + '<span>' + 
						data[d].preview.pair[p].value + '</span></p>';
				}
			}
			alertPreviewString += '</a></li>';
		$('#alerts_preview').append(alertPreviewString);
		}
	}	
	
	function populateAlertDetailPane(data, id) { //Build an html string from the JSON data and append it to alert_details.  This is messy :(
		$('#alert_details').empty();	
		alertDetailsString = '<ul class="alerts rounded"><li><p class="header" id="alertDetailHeader">'+ data[id].header + '</p>';
		for ( var p in data[id].detail.pair ) {  //loop through the details for this alert 
			alertDetailsString += '<p class="pair">' + 
			data[id].detail.pair[p].key + '<span>' + 
			data[id].detail.pair[p].value + '</span></p>';
		}
	
		if (data[id].detail.content && data[id].detail.content.length > 0) { 
			alertDetailsString += '<p class="content" id="alertDetailContent">' + decodeURI(data[id].detail.content) + '</p>';	 	 
		}
		///////////if this alert requires acknowledgement	
		if (data[id].detail.path && data[id].detail.path.length > 0) {  
			alertDetailsString += '<form id="alert_ack_form" action=' + data[id].detail.path + ' method="post" >';
			////////////if this is an 'advanced' acknowledgement
			if (data[id].detail.response != null) {	
				alertDetailsString += '<br><select name="alert_attempt[call_down_response]" >' + 
					'<option value="" SELECTED>Select your response...</option>';
				for (var o in data[id].detail.response ){
					alertDetailsString += ' <option value="' + o + '">' + data[id].detail.response[o] + '</option>';
				}	
				alertDetailsString += '</select>';
			}
			alertDetailsString += 
				'<a href="#alerts_pane" class="blueButton submit acknowledge">Acknowledge</a>' +
				'<input name="_method" type="hidden" value="put">' + 
				'<input name="authenticity_token" type="hidden" value="/">' +
				'</form>';
		}
		alertDetailsString += '</ul></li>';	
		$('#alert_details').append(alertDetailsString);	
	}	
	
	function fetchAlerts() {
		showMessageBox('loadingalerts', '#alerts_preview');
		$.ajax({
		   type: "GET",
		   dataType: "json",
		   url: DOMAIN + "/han.json",
			 beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
		   success: function(data) {
		   	hideMessageBox(); 
		   	loadAlertsData(data);
		   	},
		   error: function(xhr) {
		   	hideMessageBox();
				switch (xhr.status) {
					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
					default:  msg("Network error. (code: people " + xhr.status + ")"); 
				}
			}
		});
	}
	
	function loadAlertsData(data) {
		populateAlertsPreviewPane(data); // stuff data into main alerts page
		$("#alerts_preview li a").click(function(e) {		
			var id = $(this).attr("alert_id")||0;	//
			populateAlertDetailPane(data,id);  //fill the detail pane with data 
		});
		hideMessageBox();
		return false;
	};

	// People Search			
	
	$("#people_roles_select").setTemplateElement("role_select_template");
	$("#people_jurisdictions_select").setTemplateElement("jurisdiction_select_template");
	
	$('#people_search_pane').bind('pageAnimationStart', function(event, info){
		if (info.direction == 'in') {
    		fetchRoles(); 
			fetchJurisdictions();
		}
	});

	
			
	function fetchRoles() {
		$('#people_roles_select').empty();
		$('#people_roles_select').append('<p id="progress">Loading roles...</p>');
		dataRequest = '{"request":{"method": "user_roles","only":["id","name"],"age": ' + getRolesAge() + '}}';
		$.ajax({
			type: "POST",
			data: dataRequest , 
			contentType: "application/json",
			dataType: "json",
			url: "http://localhost:3000/roles/mapping.json",
			beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
			success: function(data) {
				hideMessageBox();
				setRoles(data);
				$('#people_roles_select').processTemplate(getRoles());},
			error: function(xhr) {
				hideMessageBox();
				switch (xhr.status) {
//					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
					default:  msg("Network error. (code: people " + xhr.status + ")");}
				}

		});
	}

	function fetchJurisdictions() {
		$('#people_jurisdictions_select').empty();
		$('#people_jurisdictions_select').append('<p id="progress">Loading jurisdictions...</p>');
		dataRequest = '{"request":{"method": "nonroot","only":["id","name"],"age": ' + getJurisdictionsAge() + '}}';
		$.ajax({
			type: "POST",
			data: dataRequest ,
			contentType: "application/json",
			dataType: "json",
			url: "http://localhost:3000/jurisdictions/mapping.json",
			beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
			success: function(data) {
				hideMessageBox();
				setJurisdictions(data);
				$('#people_jurisdictions_select').processTemplate(getJurisdictions());},
			error: function(xhr) {
				hideMessageBox();
				switch (xhr.status) {
//					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
					default:  msg("Network error. (code: people " + xhr.status + ")");
				}
			}
		});
	}
	
	$('#people_pane').bind('pageAnimationStart', function(event, info){
		if (info.direction == 'in') {
			if(!$("#people_pane").data('loaded')) {   //don't hit the server again if there are already current search results 
				$('#people_results').empty();
    			makeSearchRequest();
    		}
    		$('#people_pane').data('loaded', false);
		}
	});
	
	$('#new_contact_pane').bind('pageAnimationStart', function(event, info){
		if (info.direction == 'in') {
    		$('#people_pane').data('loaded', true);  
    	}
	});
	
	// takes the contents of #people_search_form, gets results form the server, and fires the populate function on success 
	function makeSearchRequest(){  
		showMessageBox('loadingsearch', '#people_results');
		//////// silently add a wildcard (*) to the end of names
		searchDataObject = $('#people_search_form').serializeObject(); 
		var reWild = /[^\*]$/;  /// returns true is there is no trailing wildcard
		//////// don't want to double up the wildcard
		if (searchDataObject.first_name.match(reWild)){ searchDataObject.first_name += '*'; } 
		if (searchDataObject.last_name.match(reWild)){ searchDataObject.last_name += '*'; } 
		searchData = $.param(searchDataObject);		//convert back to URLencoded string
		$.ajax({
		   type: "POST",
		   data: searchData,
		   dataType: "json",
		   url: DOMAIN + "/search/show_advanced.json",
			 beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
		   success: function(data) { 
		   	loadPeopleData(data);
		   },
		   error: function(xhr) {
		   	hideMessageBox();
				switch (xhr.status) {
					case 500: msg("Likely search engine problem. (code: 500)"); break;
					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
					default: msg("Network error. (code: people " + xhr.status + ")");
				}
			}
		});//end $.ajax	 
	}	

	function loadPeopleData(data) {
		populatePeopleResultsPane(data);		
		$("#people_results li a").click(function(e) {		
			var id = $(this).attr("contact_id")||0;	 	//grab the id of clicked contact 
			populateNewContactPane(data, id);  		//fill the detail pane with data 
		});
	};

	function populatePeopleResultsPane(data){	
		if(data.length > 0){
			for (var d in data){
				var personResultString = 
					'<ul id="people" class="people edgetoedge"><li class="person arrow">' + 
					'<a href="#new_contact_pane" class="swap" contact_id="'+ d + '">'; // **THIS BREAKS BADLY WITHOUT CLASS="SWAP".  NO, I DON'T KNOW WHY***
				if (data[d].header && data[d].header.length > 0){  						////contact name 
					personResultString += '<p class="header">' + data[d].header + '</p>';  
				} 
				for (var p in data[d].preview.pair){
					if (data[d].preview.pair[p].key){
						personResultString += '<p>' + data[d].preview.pair[p].key + '</p>';
					}
				}
				personResultString += '</a></li></ul>';
				$('#people_results').append(personResultString );
				hideMessageBox();
			} 
		} else {
			showMessageBox('nosearch', '#people_results');	
		}
		
	}

	function populateNewContactPane(data, id){	
		contactPaneString = '<ul class="rounded"><form id="new_contact_form" action="#" method="post" accept-charset="utf-8">';
		var name = data[id].header.split(" ");
		var firstName = name[0];
		var lastName = name[name.length -1];
		contactPaneString += '<li><p class="contactLabel" <label for="firstName">First Name</label></p>';	
		contactPaneString += '<p><input class="contactValue" name="firstName" type="text" value="' + firstName + '"></p></li>';
		contactPaneString += '<li><p class="contactLabel" <label for="lastName">Last Name</label></p>';	
		contactPaneString += '<p><input class="contactValue" name="lastName" type="text" value="' + lastName + '"></p></li>';
		contactPaneString += '<li><p class="contactLabel" <label for="phoneNumber">Phone Number</label></p>';
		var phoneNumberString = ' value="" placeholder="[not available]" ';
		for (var p in data[id].phone){
			if ( data[id].phone[p].officePhone && data[id].phone[p].officePhone.length > 0 ){
				phoneNumberString = ' value="' + data[id].phone[p].officePhone + '" ';
			}
		}
		contactPaneString += '<p><input class="contactValue" name="phoneNumber" type="text" ' + phoneNumberString + ' ></p></li>';
		contactPaneString += '<li><a id="create_contact" href="#people_pane" class="blueButton submit">Create</a></li></form></ul>';	
		$('#new_contact').empty();
		$('#new_contact').append(contactPaneString ); 		
	}
	
}); // end document.ready 

function newContact(contact,addContact_Return) {
	try {navigator.contacts.newContact(contact, addContact_Return);}
	catch(e) {alert(contact.firstName+" "+contact.lastName+" "+contact.phoneNumber);}
}

function addContact_Return(contact) {
	if (contact) {
		navigator.notification.alert(contact.firstName+" "+contact.lastName,"Created Contact", "OK");
	}
}

