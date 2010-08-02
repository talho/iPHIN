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
    'jqtouch/themes/jqt/img/loading.gif'
  ]
});

var DOMAIN = "http://localhost:3000"; /* "http://www.txphin.org" release */

function setCookie(data) {sessionStorage._cookie = data.cookie;}
function getCookie() {return sessionStorage._cookie;}

function setAlertDetail(data) {sessionStorage.alertDetail = data;}
function getAlertDetail() {return sessionStorage.alertDetail;}

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

$(document).ready(function() {
	
	if (typeof(PhoneGap) != 'undefined') {
	    $('body > *').css({minHeight: '460px !important'});
	}

	// SignIn 
	
	$('a#signin').click(function(event) {
		$.ajax({
		   type: "POST",
		   data: $('#signin_form').serialize(),
		   dataType: "json",
		   url: DOMAIN + "/session.json",
		   success: function(data) {
				 setCookie(data);
				 jQT.goTo($('#alerts_pane'), 'flip')
			 },
		   error: function(xhr) {
					switch (xhr.status) {
						case 401: alert("Unauthorized Access"); break;
						case 0:   alert("Failed Sign in"); break;
						default: alert("Server error");}
			 }
		});
		return false;
	});
	
	// Load the Alert previews

	$('#alerts_pane').bind('pageAnimationStart', function(event, info){
    if (info.direction == 'in') fetchAlerts();
	});
	
	function fetchAlerts() {
		$.ajax({
		   type: "GET",
		   dataType: "json",
		   url: DOMAIN + "/han.json",
			 beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
		   success: function(data) {loadAlertsData(data);},
		   error: function(xhr,status) {alert(xhr.status);}
		});
	}

	$("#alerts_preview").setTemplateElement("alerts_preview_template");
	$("#alert_detail_sub").setTemplateElement("alerts_detail_template");

	function loadAlertsData(data) {
		$('#alerts_preview').processTemplate(data);
		$("#alerts_preview li a").click(function(e) {
			id = $(this).attr("alert_id")||0;
			alert(data[id].header);
			$('#alert_detail_sub').processTemplate(data[$(this).attr("alert_id")||0]);
			jQT.goTo($('#alert_detail_pane'), 'slide');
		});
		return false;
	};

	// People Search
	
	$("#people_roles_select").setTemplateElement("role_select_template");
	$("#people_jurisdictions_select").setTemplateElement("jurisdiction_select_template");

	$('a#quicksearch').click(function(event) {
		$.ajax({
		   type: "POST",
		   data: $('#people_search_form').serialize(),
		   dataType: "json",
		   url: DOMAIN + "/search/show_advanced.json",
			 beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
		   success: function(data) {loadPeopleData(data);},
		   error: function(xhr) {
				switch (xhr.status) {
					case 500: alert("Likely search engine problem"); break;
					default: alert("Server error");}
				}
		});
		return false;
	});
		
	$('#people_search_pane').bind('pageAnimationStart', function(event, info){
    if (info.direction == 'in') {
			fetchRoles(); 
			fetchJurisdictions();};
	});
	
	function fetchRoles() {
		$.ajax({
			type: "POST",
			data: '{"request":{"method": "user_roles","only":["id","name"],"age": ' + getRolesAge() + '}}',
			contentType: "application/json",
			dataType: "json",
			url: "http://localhost:3000/roles/mapping.json",
			beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
			success: function(data) {
				setRoles(data);
				$('#people_roles_select').processTemplate(getRoles());},
			error: function(xhr,status) {alert(xhr.status);}
		});
	}

	function fetchJurisdictions() {
		$.ajax({
			type: "POST",
			data: '{"request":{"method": "nonroot","only":["id","name"],"age": ' + getJurisdictionsAge() + '}}',
			contentType: "application/json",
			dataType: "json",
			url: "http://localhost:3000/jurisdictions/mapping.json",
			beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
			success: function(data) {
				setJurisdictions(data);
				$('#people_jurisdictions_select').processTemplate(getJurisdictions());},
			error: function(xhr,status) {alert(xhr.status);}
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
				//newContact(new_contact); // for test only
				navigator.contacts.newContact(new_contact, addContact_Return);
			});
			return false;
		});
	};

	function addContact_Return(contact) {
		if (contact) {
			navigator.notification.alert(contact.firstName,contact.lastName, "Dismiss");
		}
	}

	function newContact(contact) {
		alert(contact.firstName+" "+contact.lastName+" "+contact.phoneNumber);
	}

});

