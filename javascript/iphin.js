var PROTOCOL = "http://";
//var HOST = "txphin.org" // for production
//var HOST = (/iphone/i.test(navigator.platform)) ? "192.168.30.97:8080" : "localhost:3000"
var HOST = "iphin.texashan.org"
//var HOST = "192.168.1.44:3000"; //rich's computer
//var HOST = "localhost:3000";
var DOMAIN   = PROTOCOL + HOST;
var ALERTS_PER_PAGE = 10; // number of alerts pulled at a time 
var PEOPLE_PER_PAGE = 10; // number of people results pulled at a time 

// Wait for PhoneGap to load
function onBodyLoad() {	
	document.addEventListener("deviceready",onDeviceReady,false);	
}
// PhoneGap is loaded and it is now safe to make calls PhoneGap methods
function onDeviceReady() { 
	try { navigator.network.isReachable(DOMAIN, reachableCallback); }
	catch (e) {msg("Not on the iPhone Network: connection reporting could be limited.");}
}
// Check network status
function reachableCallback(reachability) {
	internetConnStatus = reachability.internetConnectionStatus;
	wifiConnStatus = reachability.localWiFiConnectionStatus;
	if (internetConnStatus == 0) {
		if (wifiConnStatus == 1) { 
			navigator.notification.alert("Network unavailable. Switch to Wi-Fi for Access.","TxPhin", "OK"); 
		}
		else if (wifiConnStatus == 0) { 
			navigator.notification.alert("Network unavailable. Relocate to get connection.","TxPhin", "OK"); 
		}
	}
}

var jQT = new $.jQTouch({
  icon:'images/txphin-icon.png',
  //addGlossToIcon: false,
  startupScreen:"images/startup.png",
  statusBar:'black-translucent',
	useFastTouch: false,  //causes the app to feel a little sluggish, but fixed a large number of tap related issues
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

function setCookie(data) {
		window['localStorage']._cookie = data.cookie;
		}
function getCookie() {
		return window['localStorage']._cookie;
	}

function getRoles() {
    return $('body').data('roles') || "";
  }
function setRoles(data) {
		if (data.roles.length>0) {
			$('body').data('roles', data.roles);
			setRolesExpiresOn(data.expires_on);
		}
	}
	
function getJurisdictions() {
	  return $('body').data('jurisdictions') || "";
	}
function setJurisdictions(data) {
		if (data.jurisdictions.length>0) {
		  $('body').data('roles', data.jurisdictions);
			setJurisdictionsExpiresOn(data.expires_on);
		}
	}
	
function setRolesExpiresOn(date) {
	  $('body').data('roles_expires_on', date);
	}
function rolesHasExpired() {
	  return (Date() > new Date($('body').data('roles_expires_on')||0)) ;
	}
	
function setJurisdictionsExpiresOn(date) {
	  $('body').data('jurisdictions_expires_on', date);
	}
function jurisdictionsHasExpired() {
	  return (Date() > new Date($('body').data('jurisdictions_expires_on')||0)) ;
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
		case 'expired':
		  userMessage = '<li id="messageBox">Your session has expired.</li>';
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

	if(typeof(getCookie()) != 'undefined'){  // if they're not already logged in 
		fetchRoles();
		fetchJurisdictions();
		fetchAlerts();
		jQT.goTo($('#alerts_pane'), 'dissolve');
	} else {
		jQT.goTo($('#signin_pane'), 'flip');
	}		

////////// Initial setup //////////
	$('a#signin').click(function(event) {
	  if (!$('#signin_pane').data('clicked')){
	    $('#signin_pane').data('clicked', true);
      userSignIn();
    }
		return false;
	});
	
	$('#loginEmailField, #loginPasswordField').keypress(function(e) { //set up [enter key] listener for login
    if(e.which == 13) {
    	e.preventDefault();
      jQuery(this).blur();
      jQuery('#signin').focus().click();
    }
	});	
		
	$('.peopleEnterkey').keypress(function(e) { //set up [enter key] listener for people search
    if(e.which == 13) {
    e.preventDefault();
    jQuery(this).blur();
    jQuery('#quicksearch').focus().click();
   }
	});
	
	$('#alerts_preview').data('page', 1);  // initialize alerts pagination	
  $('#people_pane').data('page', 1);  // initialize alerts pagination	 
  $('#alerts_preview').data('lock', true) // lock firing of loadMoreAlerts until populateAlertsPreviewPane runs 
  $('#people_pane').data('lock', true) // lock firing of loadMorePeople until populatePeopleResultsPane runs 
  $('#signin_pane').data('clicked', false); //init login clicklocker
	
  $(window).scroll(function(){  //this fires loadMoreAlerts if we've hit the bottom of the page and it's not locked. 
    if  ($(window).scrollTop() == $(document).height() - $(window).height()){
      if ($('body').data('currentPane') === 'alerts' ){
        if (!$('#alerts_preview').data('lock')) {  
          loadMoreAlerts();
        }
      } else if ($('body').data('currentPane') === 'people' ){
        if (!$('#people_pane').data('lock')) {
          loadMorePeople();
        }
      }
    }
  });	
	
////////// Alerts bindings //////////
	$('#alerts_pane').bind('pageAnimationStart', function(event, info){
   	if (info.direction == 'in') {
   	  $('body').data('currentPane', 'alerts');
   		if (!$("#alerts_pane").data('loaded')){
				fetchAlerts();
        $("#alerts_pane").data('loaded', true)
   		}
   	}
	});	
	
	$('#alert_detail_pane').bind('pageAnimationStart', function(event, info){
		if (info.direction == 'in') {
			var id = $(this).data('referrer').attr('alert_id');
			//$('#alerts_preview').data('clickedAlert', $(this).data('referrer'));  //store what was clicked, used to de-highlight after ack
			var data = $('#alerts_preview').data('alertsData'); 
			populateAlertDetailPane(data,id) 
		}
	});		
	
	$('#refreshAlertsButton').click(function(event) {  //refreshbutton binding
	  $('#alerts_preview').data('page', 1);
		fetchAlerts();
		return false;
	});		
	
	$('#logoutButton').click(function(event) {
	  $('#signin').fadeIn();
	  window['localStorage'].clear();
	  jQT.goTo($('#signin_pane'), 'flip');
	  return false;			 
	});		
		
	$('#loadmoreButton').click(function(event) { 
	  loadMoreAlerts();
	  return false;			 
	});
	
////////// People bindings //////////
	$('#people_search_pane').bind('pageAnimationStart', function(event, info){
		if (info.direction == 'in') {
		  $('#people_pane').data('page', 1);
			getJurisdictions();
			getRoles();
		}
	});	
	
	$('#people_pane').bind('pageAnimationStart', function(event, info){
		if (info.direction == 'in') {
      $('body').data('currentPane', 'people'); 
			if(!$("#people_pane").data('loaded')) {   //don't hit the server again if there are already current search results 
				$('#people_results').empty();
    			makeSearchRequest(1);
    		}
    		$('#people_pane').data('loaded', false);
		}
	});	
	
	$('#quicksearch').click(function(event) {  
    var validInput = false;   // I hate doing it this way, but so it goes.
      if ( $('#people_search_form_first_name')[0].value.length > 1 || // only accepting searches of 2 or more characters
           $('#people_search_form_last_name')[0].value.length > 1 || 
           $('#people_search_form_email')[0].value.length > 1 ||
           $('#people_search_form_roles')[0].value.length > 0 ||
           $('#people_search_form_jurisdictions')[0].value.length > 0 ){ 	
        validInput = true;
      }
    if (validInput){
      jQT.goTo($('#people_pane'), 'slideup');
	} else {
    $('badSearchInput').remove();
    errorString = '<li id="badSearchInput" >Not enough input.</li>';
    $('#people_search_form').prepend(errorString);
    
    //alert('You must enter at least two characters, or select a role / jurisdiction.');
	}
    return false;
	});
				  
	$('#new_contact_pane').bind('pageAnimationStart', function(event, info){	
		if (info.direction == 'in') {
			var id = $(this).data('referrer').attr('contact_id');
			var data = $('#people_pane').data('peopleResultsData'); 
			populateNewContactPane(data,id) ;
			$('#people_pane').data('loaded', true);  			//toggle 'loaded' to prevent refresh 
		}
	});	
				  
	
	function userSignIn(){
	  $('#signin').text('Authorizing...');
	  $.ajax({
	    type: "POST",
	    data: $('#signin_form').serialize(),
	    dataType: "json",
	    url: DOMAIN + "/session.json",
		  timeout: 10000,
		  cache: false,
	    success: function(data) {
	      $('.footerEmail').text($('#loginEmailField')[0].value); 
	      $('#signin').text('Success.');
			  $('#signin').fadeOut();	
		    setCookie(data);
			  fetchRoles();
			  fetchJurisdictions();
			  setTimeout(function() { 
			    jQT.goTo($('#alerts_pane'), 'flip'); 
			    $('#signin').text('Sign In');
			    $('#signin_pane').data('clicked', false);
			  }, 500);
		  },
	    error: function(xhr) {
	      $('#signin').text('Sign In');
	      $('#signin_pane').data('clicked', false);
        if (xhr.readyState == 4){
          switch (xhr.status) {
            case 401: msg("No user with this email and password."); break;
            case 0:   msg("No user with this email and password."); break;
            default:  msg("Network error. (code: signin " + xhr.status + ")");
          }
        } else {
          msg	('Error contacting server.');
        }
		  }
	  });
  }
	
	// Quietly fetch roles and jurisdictions 
	function fetchRoles() {
		var roles = getRoles();
		if ((roles.length > 0) && (!rolesHasExpired())) {
			populateRolesSelector(roles);
		}
		else {
   		$.ajax({
  		  type: "GET",
  		  dataType: "json",
  			timeout: 10000,
  			cache: false,
  		  url: DOMAIN + '/roles.json' ,
  			beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
        success: function(rolesData) {
          setRoles(rolesData);
          $('#people_roles_holder').show();
          populateRolesSelector(rolesData.roles);
        },
        error: function(xhr) {
          $('#people_roles_holder').hide();
        }
			});
		}
	} 

	function fetchJurisdictions() {
		var jurisdictions = getJurisdictions();
		if ((jurisdictions.length>0) && (!jurisdictionsHasExpired())) {
			populateJurisdictionsSelector(jurisdictions);
		}
		else {
			$.ajax({
			  type: "GET",
				dataType: "json",
				timeout: 10000,
				url: DOMAIN + "/jurisdictions.json",
				beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
				success: function(jurisData) {
					setJurisdictions(jurisData);
          $('#people_roles_holder').show();
					populateJurisdictionsSelector(jurisData.jurisdictions);
					},
				error: function(xhr) {
          $('#people_jurisdictions_holder').hide();
				}
			});
		};
	}  
}); // end document.ready


////////// Alerts //////////
function fetchAlerts(page) {
	  if (page === undefined || page === 1){   
	    page = 1;      //// first page requested, loading msg at top 
	    showMessageBox('loadingalerts', '#alerts_preview');
	  } 	  		
		$.ajax({
		  type: "GET",
		  dataType: "json",
			timeout: 10000,
			cache: false,
		  url: DOMAIN + '/han.json?per_page=' + ALERTS_PER_PAGE + '&page=' + page,
			beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
		  success: function(data) { 
        prepareAlertsData(data, page);
      },
		  error: function(xhr) {
        if (xhr.readyState == 4){
          switch (xhr.status) {
            case  0: 
              msg("Network unacessable.  Try using Wi-Fi?");			 
            break;			
            default: 
              msg("Network error. (code: alerts " + xhr.status + ")");
            break;  		
          }
        } else {
          msg("Error contacting server.");
        }
				$("#messageBox").text('Could not contact server.');
			}
		});
	}	
	
 function prepareAlertsData(alertsData, page){
    if (alertsData.length == 0) {
          if (page == 1){
            $("#messageBox").text('No alerts at this time.');
            return false;
          } else {
            $('#loadingMoreAlerts').text('End of alerts.');
            return false; 
          }
        }
        if (alertsData[0].SESSION == 'EXPIRED') {   
          jQT.goTo($('#signin_pane'), 'flip');
          showMessageBox('expired', '#signin_fields');
          return false;
        }
        if (page > 1){  // if we need to append this data to the current set
          var currentData = $('#alerts_preview').data('alertsData');  //make a copy
          var firstNewAlertNumber = ALERTS_PER_PAGE * (page -1);
          for (var d in alertsData) {
            var k = parseInt(firstNewAlertNumber) + parseInt(d);
            currentData[k] = alertsData[d];  //alter the copy
          }
          $('#alerts_preview').data('alertsData', currentData);  //overwrite old with altered copy
        } else {
          $('#alerts_preview').data('alertsData', alertsData);  //store alerts data
        }
        populateAlertsPreviewPane(page); // stuff data into main alerts page    
  }	
  
function loadMoreAlerts(){
    $('#alerts_preview').data('lock', true);    //lock it
    var loadingMoreString = '<li id="loadingMoreAlerts"><img src="images/loading.gif"> Loading more alerts...<br /></li>';
    $('#alerts_preview').append(loadingMoreString);
    $('#alerts_preview').data('page', $('#alerts_preview').data('page') + 1 );  //increment page counter 
    fetchAlerts($('#alerts_preview').data('page'));
  }
		
function populateAlertsPreviewPane(page){  
		alertsData = $('#alerts_preview').data('alertsData');  //just for redability 
		if (page == 1){  
		  hideMessageBox();
		  $('#alerts_preview').empty();
		  var firstNewAlertNumber = 0;
		    // this is redundant with the binding on alerts_pane animation->in, 
	      // but needed if the app loads and a cookie is present 
	    $('body').data('currentPane', 'alerts');
		} else {
		  $('#loadingMoreAlerts').remove();
		  var firstNewAlertNumber = ALERTS_PER_PAGE * (page - 1);
		}
		for (var d = firstNewAlertNumber; d < alertsData.length; d++){  //for each new alert
			var alertPreviewString = '<li class="arrow '; 
			if (alertsData[d].detail.path) {	alertPreviewString += 'ackPreview';	}   //add CSS class to distinguish alerts that need ack.
			alertPreviewString += ' "><a href="#alert_detail_pane" class="detailLink" alert_id="' + d + '">';
			var severityIcon = 'images/status_unknown.png';
			if (alertsData[d].preview.pair ){	///would really like to reform JSON so we don't have to loop like this 
				for (var p1 in alertsData[d].preview.pair){	
					if (alertsData[d].preview.pair[p1].key === 'Severity'){
						switch(alertsData[d].preview.pair[p1].value){
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
			if (alertsData[d].header && alertsData[d].header.length > 0 ){
				alertPreviewString += '<p class="header">' + alertsData[d].header + '</p>';
			}
			if (alertsData[d].preview.pair){ 
				for (var p2 in alertsData[d].preview.pair){ //for each pair in the alert 
					alertPreviewString += '<p class="pair">' + 
						alertsData[d].preview.pair[p2].key + '<span>' + 
						alertsData[d].preview.pair[p2].value + '</span></p>';
				}
			}
			alertPreviewString += '</a></li>';
		  $('#alerts_preview').append(alertPreviewString);
		}
		if (alertsData.length ==  ALERTS_PER_PAGE * page){
		  $('#alerts_preview').data('lock', false); //unlock loading of more alerts
		} else {
      var noMoreString = '<li id="loadingMoreAlerts">End of alerts.<br /></li>';
      $('#alerts_preview').append(noMoreString);
		}
	}	
	
  function populateAlertDetailPane(data, id) { //// Build an html string from the JSON data and append it to alert_details.  This is messy :(
		$('#alert_details').empty();	
		var alertDetailsString = '<ul class="alerts rounded"><li><p class="header" id="alertDetailHeader">'+ data[id].header + '</p>';
		for ( var p in data[id].detail.pair ) {  //// loop through the details for this alert 
			alertDetailsString += '<p class="pair">' + 
			data[id].detail.pair[p].key + '<span>' + 
			data[id].detail.pair[p].value + '</span></p>';
		}	
		if (data[id].detail.content && data[id].detail.content.length > 0) { 
			alertDetailsString += '<p class="content" id="alertDetailContent">' + decodeURI(data[id].detail.content) + '</p>';	 	 
		}
		if (data[id].detail.path && data[id].detail.path.length > 0) {  //// if this alert requires acknowledgement	  
			if (data[id].detail.response != null) {	//// if this is an 'advanced' acknowledgement
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
		$('.radioList').click(function() {	
			$(this).children(".radioButtons").attr('checked', true);
			$(this).children(".radioButtons").change();
		});
		$('.radioButtons').change(function() {
			$('.radioList').removeClass('radioListSelected');
			$(this).parent().addClass('radioListSelected');
		});

	$('#ackButton').click( function() {
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
		return false; 
	});	
}		  
	
function acknowledgeAlert(path, calldown){
	var xhr = $.ajax({
	  type: "GET",
	  url: DOMAIN + path + '.json', 
	  data: calldown,  
		timeout: 10000,
		beforeSend: function(xhr) {
		  xhr.setRequestHeader("Cookie", getCookie()); 
		},
	  success: function(resp, text) {
		  if (xhr.status == 200) {        ///Hacky crappy workaround to jquery bug wherein EVERY response comes back 'success'
				// everything ok
				$('#ackButton').text('Thank you.');
				$('#alerts_pane').data('loaded', false);  // unset 'loaded' flag
				$('#alerts_preview').data('page', 1);
				//$('#alerts_preview').data('clickedAlert').removeClass('ackPreview');
				setTimeout(function() { $('#ackButton').fadeOut(); }, 2000);	
			} else {
 				// it's actually an error
 				$('#ackButton').text('Acknowledge');
 				msg('Network error. Alert NOT acknowledged.');
			}
		},
	   error: function(xhr) {
			$('#ackButton').text('Acknowledge');
	   	msg('Network error.  Alert NOT acknowledged.');
		}
	});
}	
			
////////// People Search  //////////				
	
	// takes the contents of #people_search_form, gets results form the server, and fires the populate function on success 
function makeSearchRequest(page){
  $('#people_results').data('searchData', $('#people_search_form').serializeObject() );  
  if (page === undefined || page === 1){   
    page = 1;      //// first page requested, loading msg at top 
	  showMessageBox('loadingsearch', '#people_results');
	}
	$.ajax({
	   type: "POST",
	   data: $('#people_results').data('searchData'),  
	   dataType: "json",
		 timeout: 10000,
	   url: DOMAIN + '/search/show_advanced.json?per_page=' + PEOPLE_PER_PAGE + '&page=' + page,
		 beforeSend: function(xhr) { xhr.setRequestHeader("Cookie", getCookie()); },
	   success: function(data) { 
	   	preparePeopleData(data, page); 
	   },
	   error: function(xhr) {
	   	hideMessageBox();
      if (xhr.readyState == 4){
        switch (xhr.status) {
          case 500: msg("Likely search engine problem. (code: 500)"); break;
          case   0: msg("Network error.  Try using Wi-Fi?."); break;
          default: msg("Network error. (code: people " + xhr.status + ")");
        }
      } else {
        msg('Error contacting server.');
      }
		}
	});//end $.ajax	 
}	

function preparePeopleData(peopleData, page){
  if (peopleData.length == 0) {
        if (page == 1){
          showMessageBox('nosearch', '#people_results');
          return false;
        } else {
          $('#loadingMorePeople').text('End of results.');
          return false; 
        }
      }
      if (peopleData[0].SESSION == 'EXPIRED') {    
        jQT.goTo($('#signin_pane'), 'flip');
        showMessageBox('expired', '#signin_fields');
        return false;
      }
      if (page > 1){  // if we need to append this data to the current set
        var currentData = $('#people_pane').data('peopleResultsData');  //make a copy
        var firstNewPersonNumber = PEOPLE_PER_PAGE * (page -1);
        for (var d in peopleData) {
          var k = parseInt(firstNewPersonNumber) + parseInt(d);
          currentData[k] = peopleData[d];  //alter the copy
        }
        $('#people_pane').data('peopleResultsData', currentData);  //overwrite old with altered copy
      } else {
        $('#people_pane').data('peopleResultsData', peopleData);  //store results data
      }
      populatePeopleResultsPane(page); // stuff data into main alerts page    
}	

function populatePeopleResultsPane(page){	
  $('.spacerBreak').remove();
  resultsData = $('#people_pane').data('peopleResultsData');  //just for redability 
  if (page == 1){  
    hideMessageBox();
    $('#people_results').empty();
  var firstNewPersonNumber = 0;
  } else {
    $('#loadingMorePeople').remove();
	  var firstNewPersonNumber = PEOPLE_PER_PAGE * (page - 1);
	}	
	for (var d = firstNewPersonNumber; d < resultsData.length; d++){ 		 	
		var personResultString = '<li class="person">' + 
			'<a href="#new_contact_pane"  class="pop" contact_id="'+ d + '">'; // **THIS BREAKS BADLY WITHOUT ANIMATION CLASS.  I DO NOT KNOW WHY***
		if (resultsData[d].header.first_name && (resultsData[d].header.first_name.length > 0 || resultsData[d].header.last_name.length > 0)){  						////contact name 
			personResultString += '<p class="header">' + resultsData[d].header.first_name + ' ' + resultsData[d].header.last_name + '</p>';  
		} 
		for (var p in resultsData[d].preview.pair){
			if (resultsData[d].preview.pair[p].key){
				personResultString += '<p>' + resultsData[d].preview.pair[p].key + '</p>';
			}
		}
		personResultString += '</a></li>';	
		$('#people_results').append(personResultString );
	} 
	if (resultsData.length ==  PEOPLE_PER_PAGE * page){ 
	  $('#people_pane').data('lock', false); //unlock loading of more results
	} else {
    var loadingMoreString = '<li id="loadingMorePeople">End of results.<br /></li>';
    $('#people_results').append(loadingMoreString);
	}
  $('#people').append('<br class="spacerBreak" /><br class="spacerBreak" />');	
}
	
function loadMorePeople(){
  $('#people_pane').data('lock', true);    //lock it
  var loadingMoreString = '<li id="loadingMorePeople"><img src="images/loading.gif"> Loading more results...<br /></li>';
  $('#people_results').append(loadingMoreString);
  $('#people_pane').data('page', $('#people_pane').data('page') + 1 );  //increment page counter 
  makeSearchRequest($('#people_pane').data('page'));
}	

function populateNewContactPane(data, id){	
  contactPaneString = '<ul class="rounded"><form id="new_contact_form" action="#" method="post" accept-charset="utf-8">';
	contactPaneString += '<li><p class="contactLabel" <label for="firstName">First Name</label></p>';	
	contactPaneString += '<p><input class="contactValue" name="firstName" type="text" value="' + data[id].header.first_name + '"></p></li>';
	contactPaneString += '<li><p class="contactLabel" <label for="lastName">Last Name</label></p>';	
	contactPaneString += '<p><input class="contactValue" name="lastName" type="text" value="' + data[id].header.last_name + '"></p></li>';
	contactPaneString += '<li><p class="contactLabel" <label for="phoneNumber">Phone Number</label></p>';
	var phoneNumberString = ' value="" placeholder="[not available]" ';
	for (var p in data[id].phone){
		if ( data[id].phone[p].officePhone && data[id].phone[p].officePhone.length > 0 ){
			phoneNumberString = ' value="' + data[id].phone[p].officePhone + '" ';
		}
	}
	contactPaneString += '<p><input class="contactValue" name="phoneNumber" type="text" ' + phoneNumberString + ' ></p></li>';
	contactPaneString += '<li><a id="create_contact" href="#people_pane" class="blueButton submit">Add to phone</a></li></form></ul>';	
	$('#new_contact').empty();
	$('#new_contact').append(contactPaneString );
	
	$('#create_contact').click(function(event) {
	  var firstName = $(".contactValue[name=firstName]").attr("value");
	  var lastName = $(".contactValue[name=lastName]").attr("value");
	  var phoneNumber = $(".contactValue[name=phoneNumber]").attr("value");
	  var contact = { 'firstName' : firstName, 'lastName' : lastName, 'phoneNumber' : phoneNumber };
	  navigator.contacts.newContact(contact, addContact_Return);
	  return false;
  }); 
}		

function populateRolesSelector(roles){
	var rolesSelectString = 
		'<select name="with[role_ids][]" id="people_search_form_roles" >' +
		'<option value="" SELECTED>Any Role...</option>';
	for (var r in roles){
		rolesSelectString += '<option value="' + roles[r].id + '">' + roles[r].name + '</option>';
	}
	rolesSelectString += '</select>';
	$('#people_roles_select').html(rolesSelectString); 	
}
	
function populateJurisdictionsSelector(jurisdictions){
	var jurisdictionsSelectString = 
		'<select name="with[jurisdiction_ids][]" id="people_search_form_jurisdictions">' +
		'<option value="" SELECTED>Any Jurisdiction...</option>';
	for (var j in jurisdictions){
		jurisdictionsSelectString += '<option value="' + jurisdictions[j].id + '">' + jurisdictions[j].name + '</option>';
	}
	jurisdictionsSelectString += '</select>';
	$('#people_jurisdictions_select').html(jurisdictionsSelectString); 
}

function addContact_Return(contact) {
	if (contact) {
		navigator.notification.alert(contact.firstName+" "+contact.lastName,"Created Contact", "OK");
	}
}
