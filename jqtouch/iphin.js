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

$(document).ready(function() {
	
	if (typeof(PhoneGap) != 'undefined') {
	    $('body > *').css({minHeight: '460px !important'});
	}

	// SignIn 
	
	$('a#signin').tap(function(event) {
		$.ajax({
		   type: "GET",
		   data: $('#signin_form').serialize(),
		   dataType: "jsonp",
		   url: DOMAIN + "/session.json",
		   success: function(data) {
				 try {
					 sessionStorage['_auth_token'] = data.token;;
				 } catch(err) {
				   window._auth_token = data.token;
				 }
				 jQT.goTo($('#alerts_pane'), 'slideup')
			 },
		   error: function() {alert("Could not make connection to server");},
		   complete: function() {alert(sessionStorage['_auth_token']);}
		});
		return false;
	});
	
	// Alerts preview
	
	$("#alerts_preview").setTemplateElement("alerts_preview_template");
	$("#alert_detail_panes").setTemplateElement("alerts_detail_template");

	$('#alerts_pane').bind('pageAnimationStart', function(event, info){
    if (info.direction == 'in') loadAlertsPreview();
	});

	function loadAlertsPreview() {
		// fetch json data from server
		$("#alerts_preview").processTemplate(alerts_data);
		$("#alert_detail_panes").processTemplate(alerts_data);
	}

	// Alerts detail
	
 	var alerts_data = [
		{header: "Mock Alert for Iphone Demo",
		preview: {
			pair: [
				{key: "Person from",       value: "Pradeep Vittal"},
				{key: "Jurisdiction from", value: "Bell"},
				{key: "Severity",          value: "Minor"}
				]
		},
		detail: {
			pair: [
				{key: "Posted on", value: "2010"},
				{key: "By",        value: "Pradeep Vittal"},
				{key: "Status",    value: "Test"},
				{key: "Severity",  value: "Minor"},
				{key: "From",      value: "Bell"},
				{key: "ID",        value: "DSHS-2010-6"}
				],
			content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce elementum mauris nec sapien congue sit amet lacinia est tempor. Nulla at tortor orci. Vivamus feugiat lacinia purus, vitae fringilla velit imperdiet vel. Mauris hendrerit sapien eget elite.",
			path: "/alerts/1/acknowledge",
			response: {"1":"can respond in 15 minutes","2":"can respond in 30 minutes","3":"can respond in 1 hour"}
			}
		}
		];

});

