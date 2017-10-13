var Audio = (function(){
  function Audio(_visual){
    this.visual = _visual;
    this.audioContext = (window.AudioContext) ? new AudioContext : new webkitAudioContext;
    this.fileReader  = new FileReader;
    this.isReady = false;
    this.count = 0;
  }
  
  Audio.prototype.init = function(){
    this.analyser_1 = new Analyser(this, 0.7, "#004982", 3.5, 1, 700, 2, 460, true);
    this.analyser_2 = new Analyser(this, 0.82, "#30e3ca", 3, 1, 700, 0, 460, false);
    
    
    this.render();
    
    document.getElementById('file').addEventListener('change', function(e){
      this.fileReader.readAsArrayBuffer(e.target.files[0]);
    }.bind(this));
    
    var _this = this;
    
    this.fileReader.onload = function(){
      _this.audioContext.decodeAudioData(_this.fileReader.result, function(buffer){
        if(_this.source) {
          _this.source.stop();
        }
        _this.source = _this.audioContext.createBufferSource();
        _this.source.buffer = buffer;
        
        _this.source.loop = true;

        _this.connectNode(buffer);

        _this.isReady = true;
      });
    };
  }
  
  Audio.prototype.connectNode = function(buffer){
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = buffer;
        
    this.source.loop = true;
    
    this.source.connect(this.analyser_1.analyser);
    
    this.source.connect(this.analyser_2.analyser);
    
    
    this.source.connect(this.audioContext.destination);
    this.source.start(0);
  }
  
  Audio.prototype.render = function(){
    this.visual.draw();
    
    requestAnimationFrame(this.render.bind(this));
  }

  return Audio;
})();