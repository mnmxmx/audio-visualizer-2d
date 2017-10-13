var Visualiser = (function(){
  function Visualiser(){
    this.canvas = document.getElementById('visualizer');
    this.canvasContext = this.canvas.getContext('2d');
    
    this.resize();
    
    this.circleR = 450;
    this.audio = new Audio(this);
    this.audio.init();
    this.tick = 0;
  }
  
  
  Visualiser.prototype.resize = function(){
    this.canvasW = this.canvas.width = window.innerWidth * 2;
    this.canvasH = this.canvas.height = window.innerHeight * 2;
    
    if(!this.particles) return;
    for(var i = 0; i < this.particleNum; i++){
      this.particles[i].resize();
    }
  }
  
  Visualiser.prototype.calcPolorCoord = function(a, b){
    var x = Math.cos(a*2*Math.PI) * b;
    var y = Math.sin(a*2*Math.PI) * b * 0.95;
    
    return {x: x, y: y};
  }
  
  Visualiser.prototype.draw = function(){
    this.tick += 0.07;
    var canvasContext = this.canvasContext;
    canvasContext.save();
    
    canvasContext.clearRect(0, 0, this.canvasW, this.canvasH);
    canvasContext.translate(this.canvasW/2, this.canvasH/2);
    
    
    canvasContext.lineWidth = 3;
    
    this.audio.analyser_1.update();
    this.audio.analyser_2.update();
    
    
    canvasContext.restore();
  }

  return Visualiser;
})();