var PROTOCOL = "http://";
// var HOST = "txphin.org" // for production
var HOST = (/iphone/i.test(navigator.platform)) ? "192.168.1.44:3000" : "localhost:3000"
var DOMAIN   = PROTOCOL + HOST;

// Wait for PhoneGap to load
function onBodyLoad() {	
	document.addEventListener("deviceready",onDeviceReady,false);	
}
// PhoneGap is loaded and it is now safe to make calls PhoneGap methods
function onDeviceReady() { 
	try { navigator.network.isReachable(DOMAIN, reachableCallback); }
	catch (e) {alert("Since this is not on the iPhone Network connection reporting could be erroreous.");}
}
// Check network status
function reachableCallback(reachability) {
	internetConnStatus = reachability.internetConnectionStatus;
	wifiConnStatus = reachability.localWiFiConnectionStatus;
	if (internetConnStatus == 0) {
		if (wifiConnStatus == 1) { 
			navigator.notification.alert("Loss Connect by Carrier, switch to Wi-Fi for Data Access.","TxPhin", "OK"); 
		}
		else if (wifiConnStatus == 0) { 
			navigator.notification.alert("Loss Connect by Carrier and WiFi, relocate to get connection.","TxPhin", "OK"); 
		}
	}
}

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

//if(typeof sessionStorage == "undefined")
//  var sessionStorage = window;

//if(typeof localStorage == "undefined")
//  var localStorage = window;

	function setCookie(data) {window._cookie = data.cookie;}
	function getCookie() {return window._cookie;}

	function setAlertDetail(data) {localStorage.alertDetail = data;}
	function getAlertDetail() {return localStorage.alertDetail;}

	function setRolesExpiresOn(date) {localStorage.rolesExpiresOn = date;}
	function rolesHasExpired() {return (Date() > new Date(localStorage.rolesExpiresOn||0)) ;}

	function getRoles() {return JSON.parse(localStorage.roles||"[]");}
	function setRoles(data) {
		if (data.roles.length>0) {
			localStorage.roles = JSON.stringify(data.roles);
			setRolesExpiresOn(data.expires_on);
		}
	}

	function setJurisdictionsExpiresOn(date) {localStorage.jurisdictionExpiresOn = date;}
	function jurisdictionsHasExpired() {return (Date() > new Date(localStorage.jurisdictionExpiresOn||0)) ;}

	function getJurisdictions() {return JSON.parse(localStorage.jurisdictions||"[]");}
	function setJurisdictions(data) {
		if (data.jurisdictions.length>0) {
			localStorage.jurisdictions = JSON.stringify(data.jurisdictions);
			setJurisdictionsExpiresOn(data.expires_on);
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
			userMessage = '<ul id="messageBox"><li>No results. Tap Search to return.</li></ul>';
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

	//set up [enter key] listener for login
	$('#loginEmailField, #loginPasswordField').keypress(function(e) {
        if(e.which == 13) {
        		e.preventDefault();
            jQuery(this).blur();
            jQuery('#signin').focus().click();
        }
	});
	
	//set up [enter key] listener for people search
	$('#people_search_form_first_name, #people_search_form_last_name, #people_search_form_email').keypress(function(e) {
        if(e.which == 13) {
        		e.preventDefault();
            jQuery(this).blur();
            jQuery('#quicksearch').focus().click();
        }
	});

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
		   	 //$('#signin').show();
				 setCookie(data);
				 fetchRoles();
				 fetchJurisdictions();
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
	
	// Quietly fetch roles and jurisdictions 
	
	//$("#people_roles_select").setTemplateElement("role_select_template");
	//$("#people_jurisdictions_select").setTemplateElement("jurisdiction_select_template");

	function fetchRoles() {
		var roles = getRoles();
		if ((roles.length>0) && (!rolesHasExpired())) {
			populateRolesSelector(roles);
			//$('#people_roles_select').processTemplate(roles);
		}
		else {
			$.ajax({
			  type: "POST",
		   //data: $('#signin_form').serialize(),
		   dataType: "json",
		   url: DOMAIN + "/roles.json",
		   beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
				success: function(data) {
					setRoles(data);
					populateRolesSelector(roles);
					//$('#people_roles_select').processTemplate(data.roles);
					},
				error: function(xhr) {
					switch (xhr.status) {
	//					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
						default:  msg("Network error. (code: people " + xhr.status + ")");}
					}
			});
		};
	}

	function fetchJurisdictions() {
		var jurisdictions = getJurisdictions();
		if ((jurisdictions.length>0) && (!jurisdictionsHasExpired())) {
			populateJurisdictionsSelector(jurisdictions);
			//$('#people_jurisdictions_select').processTemplate(jurisdictions);
		}
		else {
			$.ajax({
			  type: "GET",
				dataType: "json",
				url: DOMAIN + "/jurisdictions.json",
				beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
				success: function(data) {
					setJurisdictions(data);
					populateJurisdictionsSelector(jurisdictions);
					//$('#people_jurisdictions_select').processTemplate(data.jurisdictions);
					},
				error: function(xhr) {
					switch (xhr.status) {
	//					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data."); break;
						default:  msg("Network error. (code: people " + xhr.status + ")");
					}
				}
			});
		};
	}

	function populateRolesSelector(roles){
		var rolesSelectString = 
			'<select name="[role_ids][]" multiple="multiple">' +
			'<option value="" SELECTED>Role...</option>';
		for (var r in roles){
			rolesSelectString += '<option value="' + roles[r].id + '">' + roles[r].name + '</option>';
		}
		rolesSelectString += '</select>';
		$('#people_roles_select').html(rolesSelectString); 	
	}
	
	function populateJurisdictionsSelector(jurisdictions){
		var jurisdictionsSelectString = 
			'<select name="[jurisdiction_ids][]" multiple="multiple">' +
			'<option value="" SELECTED>Jurisdiction...</option>';
		for (var j in jurisdictions){
			jurisdictionsSelectString += '<option value="' + jurisdictions[j].id + '">' + jurisdictions[j].name + '</option>';
		}
		jurisdictionsSelectString += '</select>';
		$('#people_jurisdictions_select').html(jurisdictionsSelectString); 
	}


	// Load the Alert previews
	
	$('#alerts_pane').bind('pageAnimationStart', function(event, info){
   	if (info.direction == 'in') {
   		if (!$("#alerts_pane").data('loaded')){
   			fetchAlerts();
   		}
   		$('#alerts_pane').data('loaded', false);
   	}
	});
	
	$('#alert_detail_pane').bind('pageAnimationStart', function(event, info){
		if (info.direction == 'in') {
			$('#alerts_pane').data('loaded', true);
		}
	});	
	
	$('#refreshAlertsButton').click(function(event) {  //refreshbutton binding
		fetchAlerts();
	});
	
	function populateAlertsPreviewPane(data){
		$('#alerts_preview').empty();
		for (var d in data){  //for each alert
			var alertPreviewString = '<li class="arrow '; 
			if (data[d].detail.path) {	alertPreviewString += 'ackPreview';	}   //add CSS class to distinguish alerts that need ack.
			alertPreviewString += ' "><a href="#alert_detail_pane" alert_id="' + d + '">';
			var severityIcon = 'images/status_unknown.png';
			if (data[d].preview.pair ){	
				for (var p1 in data[d].preview.pair){	
					if (data[d].preview.pair[p1].key === 'Severity'){
						switch(data[d].preview.pair[p1].value){
							case 'Extreme': 
								severityIcon = 'images/status_extreme.png';
							break;
							case 'Severe':
								severityIcon = 'images/status_severe.png';
							break;
							case 'Moderate':
								severityIcon = 'images/status_moderate.png';
							break; 
							case 'Minor':
								severityIcon = 'images/status_minor.png';
							break;
						}
					}	
				}
				alertPreviewString += '<img class="severityIcon" src="' + severityIcon + '">';
			}
			if (data[d].header && data[d].header.length > 0 ){
				alertPreviewString += '<p class="header">' + data[d].header + '</p>';
			}
			if (data[d].preview.pair){ 
				for (var p2 in data[d].preview.pair){ //for each pair in the alert 
					alertPreviewString += '<p class="pair">' + 
						data[d].preview.pair[p2].key + '<span>' + 
						data[d].preview.pair[p2].value + '</span></p>';
				}
			}
			alertPreviewString += '</a></li>';
		$('#alerts_preview').append(alertPreviewString);
		$("#alerts_preview li a").click(function(e) {		
				var id = $(this).attr("alert_id")||0;	//
				populateAlertDetailPane(data,id);  //fill the detail pane with data 
			});
		}
	}	
	
	function populateAlertDetailPane(data, id) { //Build an html string from the JSON data and append it to alert_details.  This is messy :(
		$('#alert_details').empty();	
		var alertDetailsString = '<ul class="alerts rounded"><li><p class="header" id="alertDetailHeader">'+ data[id].header + '</p>';
		for ( var p in data[id].detail.pair ) {  //loop through the details for this alert 
			alertDetailsString += '<p class="pair">' + 
			data[id].detail.pair[p].key + '<span>' + 
			data[id].detail.pair[p].value + '</span></p>';
		}	
		if (data[id].detail.content && data[id].detail.content.length > 0) { 
			alertDetailsString += '<p class="content" id="alertDetailContent">' + decodeURI(data[id].detail.content) + '</p>';	 	 
		}
		/////////// if this alert requires acknowledgement	
		if (data[id].detail.path && data[id].detail.path.length > 0) {  
			//////////// if this is an 'advanced' acknowledgement
			if (data[id].detail.response != null) {	
				alertDetailsString += '<br /><p class="">Please select your response:</p>';
				var doAdvancedAck = true;   ///// used on click. 
				for (var o in data[id].detail.response ){
					alertDetailsString += '<div name="" class="radioList"> <input type="radio" class="radioButtons" name="ackAdvancedResponse" value="' + o + 
					'"> ' + data[id].detail.response[o] + '</div>';
				}	
			}
			alertDetailsString += '<a href="#" id="ackButton" class="blueButton submit" onclick>Acknowledge</a>'; 
		}		
		alertDetailsString += '</ul></li>';	
		$('#alert_details').append(alertDetailsString);
		
		///////////// handle radio selection UI 
		$('.radioList').click(function() {	
			$(this).children(".radioButtons").attr('checked', true);
			$(this).children(".radioButtons").change();
		});
		$('.radioButtons').change(function() {
			$('.radioList').removeClass('radioListSelected');
			$(this).parent().addClass('radioListSelected');
		});

		///////////// handle acknowledge button clicks
		$('#ackButton').click(function() {
			var responseData = '';
			if (doAdvancedAck) {
				var detailResponse = $("input[name='ackAdvancedResponse']:checked").val(); //grab the response, if any 
				if (detailResponse == undefined) {
					msg('You must select a response.');
					return false;
				} else {
					responseData = {'alert_attempt[call_down_response]': detailResponse};
				}
			} 
			$('#ackButton').unbind('click');
			$('#ackButton').text('working...');
			acknowledgeAlert(data[id].detail.path, responseData);	 
		});	
	}	
	
	function acknowledgeAlert(path, calldown){
		var xhr = $.ajax({
		   type: "GET",
		   url: DOMAIN + path + '.json', 
		   data: calldown,  
			beforeSend: function(xhr) {
				xhr.setRequestHeader("Cookie", getCookie()); 
			},
		   success: function(resp, text) {
 				if (xhr.status == 200) {        ///Hacky crappy workaround to jquery bug wherein EVERY response comes back 'success'
 					// everything ok
 					$('#ackButton').text('Thank you.');
 					setTimeout(function() { $('#ackButton').fadeOut(); }, 2000);	
 				} else {
   				// it's actually an error
   				$('#ackButton').text('Acknowledge');
   				msg('Network error. Alert NOT acknowledged.');
 				}
			},
		   error: function(xhr) {
		   	//alert('no how no way: ' + xhr.statusText);
				$('#ackButton').text('Acknowledge');
		   	msg('Network error. (code: ack ' + xhr.statusText + ', ' + xhr.response + ')');
			}
		});
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
				switch (xhr.status) {
					case   0: msg("Loss connect by Carrier, use Wi-Fi to Access Data.");
						$("#messageBox").text('Could not contact server.'); 
					break;			
					case 404:
						$("#messageBox").text('No alerts at this time.');
					break; 
					default: 
						 msg("Network error. (code: alerts " + xhr.status + ")");
						 $("#messageBox").text('Could not contact server.');
					break;  
				}
			}
		});
	}
	
	function loadAlertsData(data) {
		if (data.length > 0 ){
			populateAlertsPreviewPane(data); // stuff data into main alerts page
			hideMessageBox();
			return false;
		}
	};

/////////////////////// People Search  //////////////////////			
	
	$('#people_search_pane').bind('pageAnimationStart', function(event, info){
		if (info.direction == 'in') {
			//     		fetchRoles(); 
			// fetchJurisdictions();
			// setRoles(data);
		}
	});
	
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
		$('#create_contact').unbind();
		$('#create_contact').bind("click",function(e) {
			var firstName = $(".contactValue[name=firstName]").attr("value");
			var lastName = $(".contactValue[name=lastName]").attr("value");
			var phoneNumber = $(".contactValue[name=phoneNumber]").attr("value");
			var contact = { 'firstName' : firstName, 'lastName' : lastName, 'phoneNumber' : phoneNumber };
			navigator.contacts.newContact(contact, addContact_Return);
		}); 		
	}
	
}); // end document.ready 

function addContact_Return(contact) {
	if (contact) {
		navigator.notification.alert(contact.firstName+" "+contact.lastName,"Created Contact", "OK");
	}
}

