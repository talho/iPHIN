var jQT = new $.jQTouch({
  icon:'apple-touch-icon.png',
  //addGlossToIcon: false,
  startupScreen:"apple-touch-startup.png",
  statusBar:'black-translucent',
  preloadImages:[
    'jqtouch/themes/jqt/img/back_button.png',
    'jqtouch/themes/jqt/img/back_button_clicked.png',
    'jqtouch/themes/jqt/img/button_clicked.png',
    'jqtouch/themes/jqt/img/grayButton.png',
    'jqtouch/themes/jqt/img/whiteButton.png',
    'images/loading.gif'
  ]
});

var DOMAIN = "http://localhost:3000"; /* "http://www.txphin.org" release */

try { localStorage.trail = ""; lstore = localStorage;}
catch(e) { lstore = window; }

function setCookie(data) {window._cookie = data.cookie;}
function getCookie() {return window._cookie;}

function setAlertDetail(data) {window.alertDetail = data;}
function getAlertDetail() {return window.alertDetail;}

// function setRolesAge(age) {localStorage.rolesAge = age;}
// function getRolesAge() {return (localStorage.rolesAge||0);}

function setRolesAge(age) {window.rolesAge = age;}
function getRolesAge() {return (window.rolesAge||0);}

//function getRoles() {return window.roles = (window.roles || (safariParse(localStorage.roles)).roles ||[]);}
function getRoles() {return window.roles = (window.roles||[]);}
function setRoles(data) {
	if (getRolesAge() < data.latest_in_secs) {
	// if ((getRolesAge() < data.latest_in_secs) || (window.roles && window.roles.length<1)) {
		window.roles = data.roles;
		// localStorage.roles = JSON.stringify(data);
		// alert(localStorage.roles.substring(0,30));
		setRolesAge(data.latest_in_secs);
	}
}

// function setJurisdictionsAge(age) {localStorage.jurisdictionsAge = age;}
// function getJurisdictionsAge() {return (localStorage.jurisdictionsAge||0);}
function setJurisdictionsAge(age) {window.jurisdictionsAge = age;}
function getJurisdictionsAge() {return (window.jurisdictionsAge||0);}

//function getJurisdictions() {return window.jurisdictions = (window.jurisdictions || (safariParse(localStorage.jurisdictions)).jurisdictions ||[]);}
function getJurisdictions() {return window.jurisdictions = (window.jurisdictions || []);}
function setJurisdictions(data) {
	if (getJurisdictionsAge() < data.latest_in_secs) {
		// if ((getJurisdictionsAge() < data.latest_in_secs) || (window.jurisdictions && window.jurisdictions.length<1)) {
		window.jurisdictions = data.jurisdictions;
		// localStorage.jurisdictions = JSON.stringify(data);
		// alert(localStorage.jurisdictions.substring(0,30));
		setJurisdictionsAge(data.latest_in_secs);
	}
}

// function safariParse(obj) {
// 	if (!obj) {return new Object();};
// 	alert(obj.substring(0,30));
// 	try {return JSON.parse(obj);} catch(e) {return new Object();};
// }

function msg(message) {
	try {navigator.notification.alert(message,"TxPhin","OK");}
	catch (e) {alert(message);}
}

function showMessageBox(command, element){  //prepends a string in a box at the top of the named element.  
	var userMessage = '';
	switch(command){
		case 'loadingalerts':
			userMessage = '<li id="messageBox" id="progress"><img src="images/loading.gif"> Loading latest alerts...</li>';
		break;
		case 'loadingsearch':
			userMessage = '<li id="messageBox" id="progress"><img src="images/loading.gif"> Searching...</li>';
		break;
		case 'auth':
			userMessage = '<li id="messageBox" id="progress"><img src="images/loading.gif"> Authenticating...</li>';
		break;
		case 'neterror':
			userMessage = '<li id="messageBox" id="progress">Could not connect to server.</li>';
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
		$.ajax({
		   type: "POST",
		   data: $('#signin_form').serialize(),
		   dataType: "json",
		   url: DOMAIN + "/session.json",
			//timeout: 10000,
			cache: false,
		   success: function(data) {
		   	 hideMessageBox();
				 setCookie(data);
				 jQT.goTo($('#alerts_pane'), 'flip')
			 },
		   error: function(xhr) {
		   	hideMessageBox();
				switch (xhr.status) {
					case 401: msg("No user with this email and password."); break;
					case 0:   msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
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
	
	function populateAlertPane(data, id) { //Build an html string from the JSON data and append it to alert_details.  This is messy :(
		$('#alert_details').empty();	
		alertDetailsString = '<ul class="alerts rounded"><li><p class="header" id="alertDetailHeader">'+ data[id].header + '</p>';
		for ( var p in data[id].detail.pair ) {  //loop through the details for this alert 
			alertDetailsString += '<p class="pair">' + 
			data[id].detail.pair[p].key + '<span>' + 
			data[id].detail.pair[p].value + '</span></p>';
		}
	
		if (data[id].content && data[id].content.length > 0) { 
			alertDetailsString += '<p class="content" id="alertDetailContent">' + data[id].content + '</p>';	 	 
		}
		///////////if this alert requires acknowledgement
		
		if (data[id].path && data[id].path.length > 0) {  
			alertDetailsString += '<form id="alert_ack_form" action=' + data[id].path + ' method="post" >';
			////////////if this is an 'advanced' acknowledgement
			if (data[id].response != null) {	
				alertDetailsString += '<br><select name="alert_attempt[call_down_response]" >' + 
					'<option value="" SELECTED>Select your response...</option>';
				for (var o in data[id].response ){
					alertDetailsString += ' <option value="' + o + '">' + data[id].response[o] + '</option>';
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

	$("#alerts_preview").setTemplateElement("alerts_preview_template");
	//$("#alert_detail_sub").setTemplateElement("alerts_detail_template");

	function loadAlertsData(data) {
		$('#alerts_preview').processTemplate(data);
		$("#alerts_preview li a").click(function(e) {		
			var id = $(this).attr("alert_id")||0;	//
			populateAlertPane(data,id);  //fill the detail pane with data 
		});
		hideMessageBox();
		return false;
	};

	// People Search			
	
	$("#people_roles_select").setTemplateElement("role_select_template");
	$("#people_jurisdictions_select").setTemplateElement("jurisdiction_select_template");
	
	$('#people_search_pane').bind('pageAnimationStart', function(event, info){
		//alert('people_search_pane: ' + info.direction);
		if (info.direction == 'in') {
    		fetchRoles(); 
			fetchJurisdictions();
		}
	});

	$('a#quicksearch').click(function(event) {
		//searchData = $('#people_search_form').serializeArray();
		//alert (searchData.toString() );
		showMessageBox('loadingsearch', '#people_search_form');
		$.ajax({
		   type: "POST",
		   data: $('#people_search_form').serialize() ,
		   dataType: "json",
		   url: DOMAIN + "/search/show_advanced.json",
			 beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
		   success: function(data) {
		   	hideMessageBox(); 
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
		});
		return false; 
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
					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
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
					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
					default:  msg("Network error. (code: people " + xhr.status + ")");
				}
			}
		});
	}

	$("#people_pane").setTemplateElement("people_results_template");
	$("#new_contact_pane").setTemplateElement("new_contact_template");

	function loadPeopleData(data) {
		$('#people_pane').processTemplate(data);
		jQT.goTo($('#people_pane'), 'slide');
		// build the handler to get to the target
		$("#people_pane li a").click(function(e) {
			var id = $(this).attr("contact_id")||0;
			var name = data[id].header.split(" ");
			var contact = {contact: [
				{name:"firstName",label:"First Name",value:name[0]},
				{name:"lastName",label:"Last Name",value:name[1]},
				{name:"phoneNumber",label:"Phone",value:"555-555-5555"}]};
			$('#new_contact_pane').processTemplate(contact);
			jQT.goTo($('#new_contact_pane'), 'slide');
			// build handler to create new contact 
			$("a#create_contact").click(function(event) {
				// { 'firstName': 'Donna', 'lastName' : 'Hammer', 'phoneNumber': '555-3333' };
				var new_contact = $('#new_contact_form').serializeObject();
				newContact(new_contact,addContact_Return);
			});
			return false;
		});
	};

});

function newContact(contact,addContact_Return) {
	try {navigator.contacts.newContact(new_contact, addContact_Return);}
	catch(e) {alert(contact.firstName+" "+contact.lastName+" "+contact.phoneNumber);}
}

function addContact_Return(contact) {
	if (contact) {
		navigator.notification.alert(contact.firstName,contact.lastName, "Dismiss");
	}
}

