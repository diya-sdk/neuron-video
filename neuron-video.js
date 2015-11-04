function errorCallback(e) {
	if (e.code == 1) {
		alert('User denied access to their camera');
	} else {
		alert('getUserMedia() not supported in your browser.');
	}
}
Polymer({
	is: 'neuron-video',
	properties: {
		height: { notify: true },
		width: { notify: true }
	},
	ready: function () {
		var that = this;
		this.width = 320;
		this.height = 240;
		this.incr = 1;
		this.video = this.$.basicStream;
		this.ctx1 = this.$.c1.getContext("2d");
		this.localMediaStream = null;
		this.imgId  = 5210;
		this.rtcSizeMax = 16000;
		this.sizeImg = this.width * this.height;
		this.nbChunks = Math.ceil((this.sizeImg) /this.rtcSizeMax);
		this.sizeLastChunk = (this.sizeImg) % this.rtcSizeMax;
		this.varTab = [];
		for (var i = 0; i < this.sizeImg; i++) {
			this.varTab.push(i/(this.width * this.height));
		}
		for (var j = this.defaultSize; j < this.sizeImg; j++) {
			this.push('neuronValues',this.initialValue);
		}
		console.log("size : "+this.varTab.size);
		setTimeout(function () {
			that.sendImage();
		}, 1000);

		/** overclock to allow sending chunks rapidly **/
		this.frequency=1000;
	},
	computeFrame: function() {
		this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);
		var frame = this.ctx1.getImageData(0, 0, this.width, this.height);
		var l = frame.data.length;
		// console.log(l);
		for (var i = 0; i < l; i++) {
			var a = i*4;
			this.varTab[i] = (frame.data[a]+frame.data[a + 1]+frame.data[a + 2])/(3*255);
		}
		// console.log(this.varTab);
		return;
	},	
	sendImage: function () {
		var that = this;
		if (this.neuron) {
			this.computeFrame();
			if(this.nbChunks>1) {

				// this.splice('neuronValues',1,0, this.imgId);
				this.neuronValues[0] = this.imgId;

				for(var c=0; c<this.nbChunks; c++) {					
					// this.splice('neuronValues',1,1, c);
					this.neuronValues[1] = c;
					
					var sizeChunk = (c==(this.nbChunks-1)? this.sizeLastChunk:this.rtcSizeMax);
					console.log(sizeChunk);
					for (var i = 0; i < sizeChunk; i++) {
						// console.log('neuronValues' + ('.' + (i+2)));
						// console.log(c*this.rtcSizeMax+i);
						
						// this.splice('neuronValues',1,i+2, this.varTab[c*this.rtcSizeMax+i]);
						this.neuronValues[i+2] = this.varTab[c*this.rtcSizeMax+i];
					}
					this.sendAll();
				}
				// console.log("varTab");
				// console.log(this.varTab);
				// console.log("neuronValues");
				// console.log(this.neuronValues);
				this.imgId++;
			}
			else {
				for (var j = 1; j < this.rtcSizeMax; j++) {
					console.log(j);
					// this.splice('neuronValues',1,j, this.varTab[j]);
					// this.set('neuronValues.'+j, this.imgId);
					this.neuronValues[j+2] = this.varTab[j];
				}
				this.imgId++;
				// console.log(this.neuronValues);
				this.sendAll();
			}
		}
		setTimeout(function () {
			that.sendImage();
		}, 200);
	},
	startVideo: function () {
		var that = this;
		if (navigator.getUserMedia) {
			navigator.getUserMedia('video', function (stream) {
				that.video.src = stream;
				that.video.controls = true;
				that.video.maxWidth = 240;
				that.video.maxHeight = 180;
				that.localMediaStream = stream;
			}, errorCallback);
		} else if (navigator.webkitGetUserMedia) {
			navigator.webkitGetUserMedia({ video: true }, function (stream) {
				that.video.src = window.URL.createObjectURL(stream);
				that.video.controls = true;
				that.video.maxWidth = 240;
				that.video.maxHeight = 180;
				that.localMediaStream = stream;
			}, errorCallback);
		} else {
			errorCallback({ target: that.video });
		}
	},
	stopVideo: function () {
		this.video.pause();
		this.localMediaStream.stop();  // Doesn't do anything in Chrome.
	},
	behaviors: [DiyaBehaviors.Neuron]
});

