var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	self.tally = [];

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.init_tcp();
	self.actions();

};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(1,'Connecting'); // status ok!

	self.init_tcp();
	self.init_feedbacks();
};

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error',"Network error: " + err.message);
		});

		self.socket.on('connect', function () {
			self.status(self.STATE_OK);
			debug("Connected");

			// Subscribe to TALLY events
			self.socket.send('SUBSCRIBE TALLY\r\n');
		})

		self.socket.on('data', function (data) {
			data = data.toString();
			if (data.startsWith('TALLY OK')) {
				self.tally = data.substring(9, data.length-2).split('');
				self.checkFeedbacks('input_preview');
				self.checkFeedbacks('input_live');
			}
		});
	}
};


// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			default: '127.0.0.1',
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port (Default: 8099)',
			width: 3,
			default: 8099,
			regex: self.REGEX_PORT
		},
		{
			type: 'dropdown',
			id: 'inputType',
			label: 'Input difinition type:',
			width: 3,
			default: 'id',
			choices: [
				{ id: 'id', 		label: 'Input as ID (Number)' },
				{ id: 'title', 	label: 'Input as Title (Text)' }
			]
		}
	]
};


// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug("destroy", self.id);
};


instance.prototype.actions = function(system) {
	var self = this;
	var regex_type = '';

	switch(self.config.inputType){

		case 'id':
			regex_type = self.REGEX_NUMBER;
			break;

		case 'title':
			regex_type = '';
			break;
		
	};

	self.system.emit('instance_actions', self.id, {

		'quickPlay': {
			label: 'Quick Play input to Program',
			options: [
				{
					type: 'textinput',
					label: 'Input',
					id: 'pgmId',
					regex: regex_type
				}
			]
		},
		'pgmSel': {
			label: 'Send Input to Program',
			options: [
				{
					type: 'textinput',
					label: 'Input',
					id: 'pgmId',
					regex: regex_type
				}
			]
		},
		'prwSel': {
			label: 'Send Input to Preview',
			options: [
				{
					type: 'textinput',
					label: 'Input',
					id: 'prwId',
					regex: regex_type
				}
			]
		},

		'prwNext': { label: 'Send Next input to Preview'},
		'prwPrv':  { label: 'Send Previous input to Preview'},

		'transition': {
			label: 'Auto Transition',
			options: [
				{
					type: 'dropdown',
					label: 'Select transition',
					id: 'transId',
					choices: [
						{ id: 'Transition1', label: 'Transition 1'},
						{ id: 'Transition2', label: 'Transition 2'},
						{ id: 'Transition3', label: 'Transition 3'},
						{ id: 'Transition4', label: 'Transition 4'},
						{ id: 'Stinger1',    label: 'Stinger 1'},
						{ id: 'Stinger2',    label: 'Stinger 2'}
					]
				}
			]
		},
		'toggle_functions': {
			label: 'Toggle Functions',
			options: [
				{
					type: 'dropdown',
					label: 'Toggle Function',
					id: 'toggleID',
					choices: [
						{ id: 'StartStopMultiCorder', label: 'Start / Stop MultCorder'},
						{ id: 'StartStopRecording',   label: 'Start / Stop Recording'},
						{ id: 'StartStopStreaming',   label: 'Start / Stop Stream'},
						{ id: 'StartStopExternal',    label: 'Start / Stop External'},
						{ id: 'Fullscreen',           label: 'Start / Stop Fullscreen'},
						{ id: 'FadeToBlack',          label: 'Fade To Black'}
					]
				}
			]
		},
		'playList_Functions': {
			label: 'Play List Functions',
			options: [
				{
					type: 'dropdown',
					label: 'Playlist Function',
					id: 'plfId',
					choices: [
						{ id: 'StartPlayList',          label: 'Start Play List'},
						{ id: 'StopPlayList',           label: 'Stop Play List'},
						{ id: 'NextPlayListEntry',      label: 'Next Item in Play List'},
						{ id: 'PreviousPlayListEntry',   label: 'Previous Item in Play List'}
					]
				}
			]
		},
		'open_pl': {
			label: 'Open Play list',
			options: [
				{
					type: 'textinput',
					label: 'Playlist name',
					id: 'plName'
				}
			]
		},
		'overlayPgm': {
			label: 'Toggle Overlay on Program',
			options: [
				{
					type: 'dropdown',
					label: 'Select Overlay',
					id: 'overlayId',
					choices: [
						{ id: 'OverlayInput1',     label: 'Overlay nr 1'},
						{ id: 'OverlayInput2',     label: 'Overlay nr 2'},
						{ id: 'OverlayInput3',     label: 'Overlay nr 3'},
						{ id: 'OverlayInput4',     label: 'Overlay nr 4'}
					]
				},
				{
					type: 'textinput',
					label: 'Input',
					id: 'pgmId',
					regex: regex_type
				}
			]
		},
		'overlayPrw': {
			label: 'Set Overlay on Preview',
			options: [
				{
					type: 'dropdown',
					label: 'Select Overlay',
					id: 'overlayId',
					choices: [
						{ id: 'PreviewOverlayInput1',     label: 'Overlay nr 1'},
						{ id: 'PreviewOverlayInput2',     label: 'Overlay nr 2'},
						{ id: 'PreviewOverlayInput3',     label: 'Overlay nr 3'},
						{ id: 'PreviewOverlayInput4',     label: 'Overlay nr 4'}
					]
				},
				{
					type: 'textinput',
					label: 'Input',
					id: 'prwId',
					regex: regex_type
				}
			]
		},
		'overlayFunctions': {
			label: 'Overlay Functions',
			options: [
				{
					type: 'dropdown',
					label: 'Select Overlay Function',
					id: 'overlayFunc',
					choices: [
						{ id: 'OverlayInput1',     				label: 'Toggle Overlay 1 on program'},
						{ id: 'OverlayInput2',     				label: 'Toggle Overlay 2 on program'},
						{ id: 'OverlayInput3',     				label: 'Toggle Overlay 3 on program'},
						{ id: 'OverlayInput4',     				label: 'Toggle Overlay 4 on program'},
						{ id: 'PreviewOverlayInput1',     label: 'Toggle Overlay 1 on preview'},
						{ id: 'PreviewOverlayInput2',     label: 'Toggle Overlay 2 on preview'},
						{ id: 'PreviewOverlayInput3',     label: 'Toggle Overlay 3 on preview'},
						{ id: 'PreviewOverlayInput4',     label: 'Toggle Overlay 4 on preview'},
						{ id: 'OverlayInput1In',      		label: 'Transition Overlay 1 on'},
						{ id: 'OverlayInput2In',      		label: 'Transition Overlay 2 on'},
						{ id: 'OverlayInput3In',      		label: 'Transition Overlay 3 on'},
						{ id: 'OverlayInput4In',      		label: 'Transition Overlay 4 on'},
						{ id: 'OverlayInput1Out',     		label: 'Transition Overlay 1 off'},
						{ id: 'OverlayInput2Out',     		label: 'Transition Overlay 2 off'},
						{ id: 'OverlayInput3Out',     		label: 'Transition Overlay 3 off'},
						{ id: 'OverlayInput4Out',     		label: 'Transition Overlay 4 off'},
						{ id: 'OverlayInput1Off',     		label: 'Set Overlay 1 off'},
						{ id: 'OverlayInput2Off',     		label: 'Set Overlay 2 off'},
						{ id: 'OverlayInput3Off',     		label: 'Set Overlay 3 off'},
						{ id: 'OverlayInput4Off',     		label: 'Set Overlay 4 off'},
						{ id: 'OverlayAllOff',    				label: 'Set All Overlays off'},
						{ id: 'OverlayInput1Zoom',    		label: 'Zoom PIP Overlay 1 to/from fulscreen'},
						{ id: 'OverlayInput2Zoom',    		label: 'Zoom PIP Overlay 2 to/from fulscreen'},
						{ id: 'OverlayInput3Zoom',    		label: 'Zoom PIP Overlay 3 to/from fulscreen'},
						{ id: 'OverlayInput4Zoom',    		label: 'Zoom PIP Overlay 4 to/from fulscreen'},
					]
				},
				{
					type: 'textinput',
					label: 'Input',
					id: 'inputId',
					regex: regex_type
				}
			]
		},
		'outputSet': {
			label: 'Set Output Source',
			options: [
				{
					type: 'dropdown',
					label: 'Select Output',
					id: 'outputId',
					choices: [
						{ id: 'SetOutput2',     label: 'Output 2'},
						{ id: 'SetOutput3',     label: 'Output 3'},
						{ id: 'SetOutput4',     label: 'Output 4'},
						{ id: 'SetOutputExternal2',			label: 'Output External 2'},
						{ id: 'SetOutputFullscreen',	 	label: 'Output Fullscreen 1'},
						{ id: 'SetOutputFullscreen2',		label: 'Output Fullscreen 2'},
					]
				},
				{
					type: 'dropdown',
					label: 'Select Input Type',
					id: 'outputType',
					choices: [
						{ id: 'Output',					label: 'Output (Porgram)'},
						{ id: 'Preview',				label: 'Preview'},
						{ id: 'MultiView',			label: 'Multiview'},
						{ id: 'Input',					label: 'Input'}
					]
				},
				{
					type: 'textinput',
					label: 'Input',
					id: 'outputInputId',
					regex: regex_type
				},
			]
		},
		'volumeFade': {
			label: 'Set Volume Fade',
			options: [
				{
					type: 'textinput',
					label: 'Fade to volume',
					id: 'fade_Min',
					default: '000',
					regex: '/^[0-9]*$/'
				},
				{
					type: 'textinput',
					label: 'Fade time in ms',
					id: 'fade_Time',
					default: '2000',
					regex: '/^(?!(0))[0-9]*$/'
				},
				{
					type: 'textinput',
					label: 'Input',
					id: 'fade_Input',
					default: '1',
					regex: regex_type
				}
			]
		},
		'startCountdown': {
			label: 'Start Countdown',
			options: [
				{
					type: 'textinput',
					label: 'Input',
					id: 'countdownStartInput',
					default: '1',
					regex: regex_type
				}
			]
		},
		'stopCountdown': {
			label: 'Stop Countdown',
			options: [
				{
					type: 'textinput',
					label: 'Input',
					id: 'countdownStopInput',
					default: '1',
					regex: regex_type
				}
			]
		},
		'setCountdownTime': {
			label: 'Set Countdown Time',
			options: [
				{
					type: 'textinput',
					label: 'Time (00:00:00)',
					id: 'countdownTime',
					default: '00:10:00',
					regex: '/^[0-9][0-9]:[0-9][0-9]:[0-9][0-9]$/'
				},
				{
					type: 'textinput',
					label: 'Input',
					id: 'countdownSetInput',
					default: '1',
					regex: regex_type
				}
			]
		},
		'nextPicture': {
			label: 'Next Picture/Slide',
			options: [
				{
					type: 'textinput',
					label: 'Input',
					id: 'nPictureInput',
					default: '1',
					regex: regex_type
				}
			]
		},
		'previousPicture': {
			label: 'Previous Picture/Slide',
			options: [
				{
					type: 'textinput',
					label: 'Input',
					id: 'pPictureInput',
					default: '1',
					regex: regex_type
				}
			]
		},
		'keyPress': {
			label: 'KeyPress',
			options: [
				{
					type: 'textinput',
					label: 'key',
					id: 'key'
				}
			]
		},
		'scriptStart': {
			label: 'Script start',
			options: [
				{
					type: 'textinput',
					label: 'Script name',
					id: 'script'
				}
			]
		},
		'scriptStop': {
			label: 'Script stop',
			options: [
				{
					type: 'textinput',
					label: 'Script name',
					id: 'script'
				}
			]
		},
		'scriptStopAll': {
			label: 'Script stop all'
		},
		'command': {
			label: 'Run custom command',
			options: [
				{
					type: 'textinput',
					label: 'Command',
					id: 'command',
					default: ''
				}
			]
		}
	});
};




	instance.prototype.action = function(action) {
		var self = this;
		var opt = action.options
		var cmd = ''
		switch (action.action) {

			case 'quickPlay':
				cmd = 'FUNCTION QuickPlay Input='+ opt.pgmId;
				break;

			case 'pgmSel':
				cmd = 'FUNCTION CutDirect Input='+ opt.pgmId;
				break;

			case 'prwSel':
				cmd = 'FUNCTION PreviewInput Input='+ opt.prwId;
				break;

			case 'prwNext':
				cmd = 'FUNCTION PreviewInputNext';
				break;

			case 'prwPrv':
				cmd = 'FUNCTION PreviewInputPrevious';
				break;

			case 'transition':
				cmd = 'FUNCTION '+ opt.transId;
				break;

			case 'toggle_functions':
				cmd = 'FUNCTION '+ opt.toggleID;
				break;

			case 'playList_Functions':
				cmd = 'FUNCTION '+ opt.plfId;
				break;

			case 'open_pl':
				cmd = 'FUNCTION SelectPlayList '+ opt.plName;
				break;

			case 'overlayPgm':
				cmd = 'FUNCTION '+opt.overlayId +' Input='+ opt.pgmId;
				break;

			case 'overlayPrw':
				cmd = 'FUNCTION '+opt.overlayId +' Input='+ opt.prwId;
				break;

			case 'overlayFunctions':
				cmd = 'FUNCTION '+opt.overlayFunc +' Input='+ opt.inputId;
				break;
	
			case 'outputSet':
				cmd = 'FUNCTION '+opt.outputId + ' Value=' + opt.outputType + '&Input=' + opt.outputInputId;
				break;
			
			case 'volumeFade':
				cmd = 'FUNCTION SetVolumeFade value=' + opt.fade_Min + ',' + opt.fade_Time + '&input=' + opt.fade_Input;
				break;

			case 'startCountdown':
				cmd = 'FUNCTION StartCountdown Input='+ opt.countdownStartInput;
				break;

			case 'stopCountdown':
				cmd = 'FUNCTION StopCountdown Input='+ opt.countdownStopInput;
				break;

			case 'nextPicture':
				cmd = 'FUNCTION NextPicture Input='+ opt.nPictureInput;
				break;

			case 'previousPicture':
				cmd = 'FUNCTION PreviousPicture Input='+ opt.pPictureInput;
				break;

			case 'setCountdownTime':
				cmd = 'FUNCTION SetCountdown Value=' + opt.countdownTime + '&Input='+ opt.countdownSetInput;
				break;

			case 'keyPress':
				cmd = 'FUNCTION KeyPress Value=' + opt.key;
				break;

			case 'scriptStart':
				cmd = 'FUNCTION ScriptStart Value=' + opt.script;
				break;

			case 'scriptStop':
				cmd = 'FUNCTION ScriptStop Value=' + opt.script;
				break;

			case 'scriptStopAll':
				cmd = 'FUNCTION ScriptStopAll';
				break;

			case 'command':
				cmd = 'FUNCTION ' + opt.command;
				break;

	};





	if (cmd !== undefined) {

		debug('sending ',cmd,"to",self.config.host);

		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd + '\r\n');
		} else {
			debug('Socket not connected :(');
		}

	}


};

instance.prototype.init_feedbacks = function() {
	var self = this;

	var feedbacks = {};
	feedbacks['input_preview'] = {
		label: 'Change colors based on previewed input',
		description: 'If the specified input is previewed, change colors of the bank',
		options: [
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255,255,255)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(0,255,0)
			},
			{
				type: 'textinput',
				label: self.config.inputType.label,
				id: 'index',
				default: 0,
				regex: self.REGEX_NUMBER
			}
		]
	};
	feedbacks['input_live'] = {
		label: 'Change colors based on live input',
		description: 'If the specified input is live, change colors of the bank',
		options: [
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255,255,255)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(0,255,0)
			},
			{
				type: 'textinput',
				label: self.config.inputType.label,
				id: 'index',
				default: 0,
				regex: self.REGEX_NUMBER
			}
		]
	};

	self.setFeedbackDefinitions(feedbacks);
}

instance.prototype.feedback = function(feedback, bank) {
	var self = this;
	if (feedback.type == 'input_preview') {
		if (self.tally[feedback.options.index-1] == 2) {
			return { color: feedback.options.fg, bgcolor: feedback.options.bg };
		}
	}
	if (feedback.type == 'input_live') {
		if (self.tally[feedback.options.index-1] == 1) {
			return { color: feedback.options.fg, bgcolor: feedback.options.bg };
		}
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
