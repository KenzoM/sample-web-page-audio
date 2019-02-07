// var ref = firebase.database().ref('speech/');
// var audioRef = firebase.storage().ref('audio/');
var $text = $("h2.main-text");
var $submit = $("button#submit");
var $recBtn = $("button#rec-btn");
var $username = $("input#username");

var audio = document.querySelector('audio');
var isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveOrOpenBlob || !!navigator.msSaveBlob);
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var recorder; // globally accessible
var microphone;

// setup for the audio recorder
function captureMicrophone(callback) {
	if(microphone) {
		callback(microphone);
		return;
	}
	if(typeof navigator.mediaDevices === 'undefined' || !navigator.mediaDevices.getUserMedia) {
		alert('This browser does not supports WebRTC getUserMedia API.');
		if(!!navigator.getUserMedia) {
			alert('This browser seems supporting deprecated getUserMedia API.');
		}
	}
	navigator.mediaDevices.getUserMedia({
		audio: isEdge ? true : {
			echoCancellation: false
		}
	}).then(function(mic) {
		callback(mic);
	}).catch(function(error) {
		alert('Unable to capture your microphone. Please check console logs.');
		console.error(error);
	});
}

function replaceAudio(src) {
	var newAudio = document.createElement('audio');
	newAudio.controls = true;
	newAudio.autoplay = true;
	if(src) {
		newAudio.src = src;
	}
	
	var parentNode = audio.parentNode;
	parentNode.innerHTML = '';
	parentNode.appendChild(newAudio);
	audio = newAudio;
}

function stopRecordingCallback() {
	replaceAudio(URL.createObjectURL(recorder.getBlob()));
	setTimeout(function() {
		if(!audio.paused) return;
		setTimeout(function() {
			if(!audio.paused) return;
			audio.play();
		}, 1000);
		
		audio.play();
	}, 300);
	audio.play();
	if(isSafari) {
		if(microphone) {
			microphone.stop();
			microphone = null;
		}

	}
}

// setup daily prompt
function setupWizardListener() {
  ref.on('value', function(snapshot) {
	var val = snapshot.val();
	$text.text(val['word']);
  });
}

function startAudioRecording() {
	if (!microphone) {
		captureMicrophone(function(mic) {
			microphone = mic;
			if(isSafari) {
				replaceAudio();
				audio.muted = true;
				audio.srcObject = microphone;
				alert('Please click startRecording button again. First time we tried to access your microphone. Now we will record it.');
				return;
			}
		});
		console.log("Microphone initialized");
		return;
	}
	replaceAudio();
	audio.muted = true;
	audio.srcObject = microphone;
	var options = {
		type: 'audio',
		numberOfAudioChannels: isEdge ? 1 : 2,
		checkForInactiveTracks: true,
		bufferSize: 16384
	};
	if(isSafari || isEdge) {
		options.recorderType = StereoAudioRecorder;
	}
	if(navigator.platform && navigator.platform.toString().toLowerCase().indexOf('win') === -1) {
		options.sampleRate = 48000; // or 44100 or remove this line for default
	}
	if(isSafari) {
		options.sampleRate = 44100;
		options.bufferSize = 4096;
		options.numberOfAudioChannels = 2;
	}
	if(recorder) {
		recorder.destroy();
		recorder = null;
	}
	recorder = RecordRTC(microphone, options);
	recorder.startRecording();
}

function stopAudioRecording() {
	recorder.stopRecording(stopRecordingCallback);
}

// create audio recordings
$recBtn.click(function(){
	if($recBtn.hasClass('not-rec')){
		$recBtn.removeClass("not-rec");
		$recBtn.addClass("rec");
		startAudioRecording();
	}
	else{
		$recBtn.removeClass("rec");
		$recBtn.addClass("not-rec");
		stopAudioRecording();
	}
});

function getFileName(fileExtension) {
	var d = new Date();
	var username = $username.val();
	return username + '-recording-' + d.toString() + '.' + fileExtension;
}

// setup the submit button
$submit.click(function(){
	// check if a name has been entered
	if ($username.val().length == 0) {
		alert("Please enter your name.");
		return;
	}
	// check if audio is recorded
	if(!recorder || !recorder.getBlob()) {
		alert("Please ensure recording is done.");
		return;
	}

	// everything passes, ready to save onto firebase storage
	var blob = recorder.getBlob();
	var filename = getFileName('mp3');
	var file = new File([blob], filename, {
		type: 'audio/mp3'
	});

	audioRef.child(filename).put(file).then(function(snapshot) {
	  console.log('Uploaded audio file!');
	  alert("Audio file uploaded! We will provide you with the report shortly.");
	});
});

// setupWizardListener();
startAudioRecording();
$recBtn.addClass("not-rec");