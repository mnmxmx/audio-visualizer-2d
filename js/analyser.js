var Analyser = (function(){
  function Analyser(audio, smoothTime, color, scale, min, max, offset, radius, isAlpha){
    this.audio = audio;
    this.visual = this.audio.visual;
    
    this.scale = scale;
    
    this.radius = radius;
    
    this.isAlpha = isAlpha;
    
    this.color = color;
    
    this.audioContext = this.audio.audioContext;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    // this.analyser.minDecibels = -60;
    // this.analyser.maxDecibels = 10;
    this.frequencyNum = 1024;
    this.hz = 22028;
    this.analyser.smoothingTimeConstant = smoothTime;
    
    this.filterLP = this.audioContext.createBiquadFilter();
    this.filterHP = this.audioContext.createBiquadFilter();

    // sourceNode.connect(this.gainNode);

    this.filterLP.type = "lowpass";
    this.filterLP.frequency.value = max;
    // this.filterLP.detune.value = 500;

    // this.filterHP.type = "highpass";
    // this.filterHP.frequency.value = 0;
    // this.filterHP.detune.value = 200;
    
    this.maxHz = max;
    this.minHz = min;
    
    this.offset = offset;
    this.radiusOffset = 16 * this.offset;
    this.count = 0;
    
    
    
    
    this.stockSpectrums = [];
    
    this.sourceStart = Math.ceil(this.frequencyNum * this.minHz / this.hz);
    this.sourceEnd = Math.round(this.frequencyNum * this.maxHz / this.hz);
    this.sourceLength = this.sourceEnd - this.sourceStart + 1;
    
    this.adjustOffset = Math.round(this.sourceLength * 0.12);
    
    this.distLength = 120;
    this.interval =  (this.sourceLength - 1) / (this.distLength - 1) ;
    
    this.totalLength = Math.round(this.distLength * 3 / 2);
  }
  
  Analyser.prototype.adjustFrequency = function(i, avr){
    var f = Math.max(0, this.spectrums[this.sourceStart + i] - avr) * this.scale;
    var offset = i - this.sourceStart;
    
    var ratio = offset / this.adjustOffset;
    
    f *= Math.max(0, Math.min(1, 5 / 6 * (ratio - 1) *  (ratio - 1) *  (ratio - 1) + 1));
    // f *= Math.max(0, Math.min(1, -3 / 4 * Math.pow(Math.exp(-ratio), 6) + 1));
    
    return f;
  }

  Analyser.prototype.update = function(){
    
    var spectrums = new Float32Array(this.frequencyNum);
    if(this.audio.isReady) {
      this.analyser.getFloatFrequencyData(spectrums);
      this.stockSpectrums.push(spectrums);
    }
    
    
    
    if(this.count < this.offset){
      this.spectrums = new Float32Array(this.frequencyNum);
    } else {
      if(this.audio.isReady){
        var _spectrums = this.stockSpectrums[0];
        
        if(!isFinite(_spectrums[0])) {
          this.spectrums = new Float32Array(this.frequencyNum);
        } else {
          this.spectrums = _spectrums;
        }
        
        this.stockSpectrums.shift(); 
      } else {
         this.spectrums = new Float32Array(this.frequencyNum);
      }
    }
    
    if(this.audio.isReady){
       this.count++;
    }
    
    
    var canvasContext = this.visual.canvasContext;
    canvasContext.strokeStyle = this.color;
    canvasContext.fillStyle = this.color;
    // canvasContext.globalCompositeOperation = (this.isAlpha) ? "multiply" : "source-over";
    // canvasContext.globalAlpha = (this.isAlpha) ? 1 : 1;
    
    
    var avr = 0;
    
    for(var i=this.sourceStart; i<=this.sourceEnd; i++){
      avr += this.spectrums[i];
    }
    
    avr /= this.sourceLength;

    avr = (!this.audio.isReady || avr === 0) ? avr : Math.min(-40, Math.max(avr, -60));
    
    canvasContext.beginPath();
    
    var frequencyArray = [];
    
    for(var i = 0; i < this.distLength; i++){
      var n1 = Math.floor(i * this.interval);
      var n2 = n1 + 1;
      var n0 = Math.abs(n1 - 1);
      var n3 = n1 + 2;
      
      
      n2 = (n2 > this.sourceLength - 1) ? (this.sourceLength - 1) * 2 - n2 : n2;
      n3 = (n3 > this.sourceLength - 1) ? (this.sourceLength - 1) * 2 - n3 : n3;
      
      var p0 = this.adjustFrequency(n0, avr);
      var p1 = this.adjustFrequency(n1, avr);
      var p2 = this.adjustFrequency(n2, avr);
      var p3 = this.adjustFrequency(n3, avr);
      
      var mu = i * this.interval - n1;

      var mu2 = mu * mu;

      var a0 = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
      var a1 = p0 - 2.5 * p1 + 2 * p2 - 0.5*p3;
      var a2 = -0.5 * p0 + 0.5 * p2;
      
      var targetFrequency = a0 * mu * mu2 + a1 * mu2 + a2 * mu + p1;
      targetFrequency = Math.max(0, targetFrequency);
      frequencyArray.push(targetFrequency);
      
      var pos = this.visual.calcPolorCoord((i + this.visual.tick + this.offset) / (this.totalLength-1), this.radius + targetFrequency + 3);
      canvasContext.lineTo(pos.x + this.radiusOffset, pos.y + this.radiusOffset);
    };
   
    
    for(var i = 1; i <= this.distLength; i++){
      var targetFrequency = frequencyArray[this.distLength - i];
      var pos = this.visual.calcPolorCoord((i/2 + this.distLength - 1 + this.visual.tick + this.offset) / (this.totalLength-1), this.radius + targetFrequency + 3);
      canvasContext.lineTo(pos.x + this.radiusOffset, pos.y + this.radiusOffset);
    }
    
    for(var i = this.distLength; i > 0; i--){
      var targetFrequency = frequencyArray[this.distLength - i];
      var pos = this.visual.calcPolorCoord((i/2 + this.distLength - 1 + this.visual.tick + this.offset) / (this.totalLength-1), this.radius - targetFrequency - 3);
      canvasContext.lineTo(pos.x + this.radiusOffset, pos.y + this.radiusOffset);
    }
    
    
    for(var i = this.distLength - 1; i >= 0; i--){
      var targetFrequency = frequencyArray[i];
      var pos = this.visual.calcPolorCoord((i + this.visual.tick + this.offset) / (this.totalLength-1), this.radius - targetFrequency - 3);
      canvasContext.lineTo(pos.x + this.radiusOffset, pos.y + this.radiusOffset);
    }
    
    
    
    canvasContext.fill();
  }

  return Analyser;
})();