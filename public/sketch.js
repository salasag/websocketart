var socket;
var points;
var bodies;
var orbiters;
var GRAVITATION = 1/50;
var REPULSION   = GRAVITATION*0;
var reflectionFactor = .6;
var CANVAS_WIDTH;
var CANVAS_HEIGHT;
var BLACK_HOLE_IMAGE;

function preload(){
  BLACK_HOLE_IMAGE = loadImage("./assets/blackhole.png")
}

function setup(){
   cnv = createCanvas(windowWidth, windowHeight);
   CANVAS_WIDTH  = windowWidth;
   CANVAS_HEIGHT = windowHeight;
   noStroke()
   socket = io.connect();
   socket.on('mouse', newDrawing);
   background(0)
   points = new Map();
   bodies = new Map();
   orbiters = new Map();
   bodies.set(0,new Body(windowWidth/2,windowHeight/2,50,50))
   orbiters.set(0,new PhysicsObject(windowWidth/2+Math.random()*100-50,windowHeight/2+Math.random()*100-50,0,0,0,0,25,25))
}

function newDrawing(data){
  if(!points.has(data.id)){
    console.log("New Connection: ",data)
    bodies.set(data.id,new Body(windowWidth/2,windowHeight/2,50,50))
    orbiters.set(data.id,new PhysicsObject(windowWidth/2+Math.random()*100-50,windowHeight/2+Math.random()*100-50,0,0,0,0,25,25))
  }
  points.set(data.id,data)
}

function draw(){
  sendData();
  accelerateObjects()
  handleObjectCollisions();
  moveObjects();
  drawObjects();
  checkTimeout();
}

function sendData(){
	var data = {
    id: socket.id,
		x: mouseX, 
    y: mouseY,
    time: (new Date().valueOf())
	}
  socket.emit('mouse', data);
}

function accelerateObjects(){
  accelerateBodies();
  accelerateOrbiters();
}

function accelerateBodies(){
  bodies.forEach((value, key, map)=>{
    if(points.get(key)){
      let socketData = points.get(key)
      var diffX = socketData.x-value.xPosition;
      var diffY = socketData.y-value.yPosition
    }
    else{
      var diffX = mouseX-value.xPosition;
      var diffY = mouseY-value.yPosition
    }
    let magnitude = getMagnitude([diffX,diffY])
    diffX /= magnitude+.001;
    diffY /= magnitude+.001;
    let xAcceleration = diffX;
    let yAcceleration = diffY;
    let magnitudeVelocity = getMagnitude([value.xVelocity+xAcceleration,value.yVelocity+yAcceleration]);
    if(magnitude <= magnitudeVelocity){
      value.xVelocity = 0;
      value.yVelocity = 0;
      value.setAcceleration(0,0)
    }
    else{
      value.setAcceleration(xAcceleration,yAcceleration)
    }
  })
}

function accelerateOrbiters(){
  orbiters.forEach((value, key, map)=>{
    value.setAcceleration(0,0)
    bodies.forEach((body)=>{
      let diffX = body.xPosition-value.xPosition;
      let diffY = body.yPosition-value.yPosition;
      let magnitude = Math.max(getMagnitude([diffX,diffY]),20);
      diffX /= magnitude;
      diffY /= magnitude;
      let acceleration = (GRAVITATION-REPULSION/magnitude)*body.mass/magnitude//magnitude; // Gm1/r^2
      value.incrementAcceleration(diffX*acceleration,diffY*acceleration);
    })
    orbiters.forEach((orbiter,keyOrbiter)=>{
      if(key!=keyOrbiter){
        let diffX = orbiter.xPosition-value.xPosition;
        let diffY = orbiter.yPosition-value.yPosition;
        let magnitude = Math.max(getMagnitude([diffX,diffY]),20);
        diffX /= magnitude;
        diffY /= magnitude;
        let acceleration = (GRAVITATION-REPULSION/magnitude)*orbiter.mass/magnitude//magnitude; // Gm1/r^2
        value.incrementAcceleration(diffX*acceleration,diffY*acceleration);
      }
    })
  })
}

function handleObjectCollisions(){
  handleOrbiterCollisions()
  handleBodyCollisions()
}

function handleBodyCollisions(){
  bodies.forEach((value, key)=>{
    bodies.forEach((body,keyBody)=>{
      if(key!=keyBody){
        let collision = isCollisionCicle(value,body);
        if(collision[0] != 0 && collision[1] != 0){
          value.xPosition += collision[0];
          value.yPosition += collision[1];
          let newVelocity = getReflection([value.xVelocity,value.yVelocity],collision)
          value.xVelocity = newVelocity[0];
          value.yVelocity = newVelocity[1];
        }
      }
    })
    orbiters.forEach((orbiter)=>{
      let collision = isCollisionCicle(value,orbiter);
      if(collision[0] != 0 && collision[1] != 0){
        value.xPosition += collision[0];
        value.yPosition += collision[1];
        let newVelocity = getReflection([value.xVelocity,value.yVelocity],collision)
        value.xVelocity = newVelocity[0];
        value.yVelocity = newVelocity[1];
      }
    })
  })
}

function handleOrbiterCollisions(){
  orbiters.forEach((value, key)=>{
    bodies.forEach((body)=>{
      let collision = isCollisionCicle(value,body);
      if(collision[0] != 0 && collision[1] != 0){
        value.xPosition += collision[0];
        value.yPosition += collision[1];
        let newVelocity = getReflection([value.xVelocity,value.yVelocity],collision)
        value.xVelocity = newVelocity[0];
        value.yVelocity = newVelocity[1];
      }
    })
    orbiters.forEach((orbiter,keyOrbiter)=>{
      if(key!=keyOrbiter){
        let collision = isCollisionCicle(value,orbiter);
        if(collision[0] != 0 && collision[1] != 0){
          value.xPosition += collision[0];
          value.yPosition += collision[1];
          let newVelocity = getReflection([value.xVelocity,value.yVelocity],collision)
          value.xVelocity = newVelocity[0];
          value.yVelocity = newVelocity[1];
        }
      }
    })
  })
}

function moveObjects(){
  moveBodies()
  moveOrbiters()
}

function moveBodies(){
  bodies.forEach((value, key, map)=>{
    value.move()
  })
}

function moveOrbiters(){
  orbiters.forEach((value, key, map)=>{
    value.move()
  })
}

function drawObjects(){
  //background(0)
  image(BLACK_HOLE_IMAGE,CANVAS_WIDTH,CANVAS_HEIGHT)
  drawOrbiters();
  drawBodies();
}

function drawOrbiters(){
  orbiters.forEach((value)=>{
    value.draw();
  })
}

function drawBodies(){
  bodies.forEach((value)=>{
    value.draw();
  })
}

function checkTimeout(){
  let time = new Date().valueOf()
  let remove = []
  points.forEach((value, key)=>{
    if((time-value.time) > 200){ // Refreshes every ~20
      console.log("Removed!")
      remove.push(key)
    }
  })
  remove.map((key)=>{
    points.delete(key)
    bodies.delete(key)
    orbiters.delete(key)
  })
}

function getMagnitude(arr){
  let sum = 0;
  for(let i = 0; i < arr.length; i++){
    sum += arr[i]*arr[i];
  }
  return Math.sqrt(sum)
}

function getReflection(vector,normal){
  let magnitude = getMagnitude(normal)+.01;
  normal = [normal[0]/magnitude,normal[1]/magnitude];
  let dot = 2*vector[0]*normal[0]+vector[1]*normal[1];
  return [vector[0]-dot*normal[0],vector[1]-dot*normal[1]]
}

function isCollisionCicle(obj1,obj2){
  let diffX = obj1.xPosition-obj2.xPosition
  let diffY = obj1.yPosition-obj2.yPosition
  let magnitude = getMagnitude([diffX,diffY])
  let radii = (obj1.width+obj1.height)/4+(obj2.width+obj2.height)/4
  if(magnitude < radii){
    let adjX = (radii-magnitude)/magnitude*diffX
    let adjY = (radii-magnitude)/magnitude*diffY
    return [adjX,adjY]
  }
  return [0,0]
}

class Body{

  constructor(initXPosition,initYPosition,initWidth,initHeight){
      this.xPosition = initXPosition;
      this.yPosition = initYPosition;
      this.xVelocity = 0;
      this.yVelocity = 0;
      this.xAcceleration = 0;
      this.yAcceleration = 0;
      this.width = initWidth;
      this.height = initHeight;
      this.mass = initWidth * initHeight;
      this.colorCycler = new ColorCycler(
        [[Math.random()*255,Math.random()*255,Math.random()*255],
         [Math.random()*255,Math.random()*255,Math.random()*255],
         [Math.random()*255,Math.random()*255,Math.random()*255]],
        100
      )
  }

  move(){
      this.xVelocity += this.xAcceleration;
      this.yVelocity += this.yAcceleration;
      let magnitude = getMagnitude([this.xVelocity,this.yVelocity])
      this.xVelocity = this.xVelocity/(magnitude+0.0001)
      this.yVelocity = this.yVelocity/(magnitude+0.0001)
      this.xPosition += this.xVelocity;
      this.yPosition += this.yVelocity;
  }

  setAcceleration(x,y){
    this.xAcceleration = x;
    this.yAcceleration = y;
  }

  draw(){
      fill(this.colorCycler.getColor())
      this.colorCycler.cycleColor()
      ellipse(this.xPosition,this.yPosition,this.width,this.height);
  }
}


class PhysicsObject{

  constructor(initXPosition,initYPosition,initXVelocity,initYVelocity,initXAcceleration,initYAcceleration,initWidth,initHeight){
      this.xPosition = initXPosition;
      this.yPosition = initYPosition;
      this.xVelocity = initXVelocity;
      this.yVelocity = initYVelocity;
      this.xAcceleration = initXAcceleration;
      this.yAcceleration = initYAcceleration;
      this.width = initWidth;
      this.height = initHeight;
      this.mass = initWidth * initHeight;
      this.colorCycler = new ColorCycler(
        [[Math.random()*255,Math.random()*255,Math.random()*255],
         [Math.random()*255,Math.random()*255,Math.random()*255],
         [Math.random()*255,Math.random()*255,Math.random()*255]],
        100
      )
  }

  move(){
      this.xVelocity += this.xAcceleration;
      this.xPosition += this.xVelocity;
      this.yVelocity += this.yAcceleration;
      this.yPosition += this.yVelocity;
      if(this.xPosition > CANVAS_WIDTH){
          this.xPosition = CANVAS_WIDTH;
          this.xVelocity *= -reflectionFactor;
      }
      if(this.xPosition < 0){
          this.xPosition = 0;
          this.xVelocity *= -reflectionFactor;
      }
      if(this.yPosition > CANVAS_HEIGHT){
          this.yPosition = CANVAS_HEIGHT;
          this.yVelocity *= -reflectionFactor;
      }
      if(this.yPosition < 0){
          this.yPosition = 0;
          this.yVelocity *= -reflectionFactor;
      }
  }

  setAcceleration(x,y){
    this.xAcceleration = x;
    this.yAcceleration = y;
  }
  
  incrementAcceleration(x,y){
    this.xAcceleration += x;
    this.yAcceleration += y;
  }

  draw(){
      fill(this.colorCycler.getColor())
      this.colorCycler.cycleColor()
      ellipse(this.xPosition,this.yPosition,this.width,this.height);
  }
}

class ColorCycler{

  constructor(colors,delay){
      this.colors = colors
      this.delay = delay
      this.currentColor = this.colors[0];
      this.currentIndex = 0;
      this.MIN_DELAY = 20
      this.MAX_DELAY = 2000
      this.updateNextColor();
  }

  getColor(){
      return this.currentColor
  }

  getColors(){
      return this.colors
  }

  getDelay(){
      return this.delay
  }

  getColorDelay(delay){
      let index = Math.floor(delay/this.delay)%this.colors.length;
      let previousColor = this.colors[index];
      let nextColor = this.colors[(index+1)%this.colors.length]
      let fractionToNext = ((delay+.1)%this.delay)/this.delay;
      let redValue   = previousColor[0]+(nextColor[0]-previousColor[0])*fractionToNext;
      let greenValue = previousColor[1]+(nextColor[1]-previousColor[1])*fractionToNext;
      let blueValue  = previousColor[2]+(nextColor[2]-previousColor[2])*fractionToNext;
      return [redValue,greenValue,blueValue]
  }

  updateNextColor(){
      this.previousIndex = this.currentIndex;
      this.currentIndex = (this.currentIndex+1)%this.colors.length
      this.previousColor = this.colors[this.previousIndex];
      this.currentColor = this.previousColor;
      this.nextColor = this.colors[this.currentIndex];
      this.updateVelocities()
  }

  updateVelocities(){
      let vRed   = (this.nextColor[0]-this.previousColor[0])/this.delay
      let vGreen = (this.nextColor[1]-this.previousColor[1])/this.delay
      let vBlue  = (this.nextColor[2]-this.previousColor[2])/this.delay
      this.velocities = [vRed,vGreen,vBlue]
  }

  cycleColor(){
      let redValue = this.currentColor[0]+this.velocities[0]
      let greenValue = this.currentColor[1]+this.velocities[1]
      let blueValue = this.currentColor[2]+this.velocities[2]
      if(Math.abs(this.nextColor[0]-this.previousColor[0])<=Math.abs(redValue-this.previousColor[0]) &&
         Math.abs(this.nextColor[1]-this.previousColor[1])<=Math.abs(greenValue-this.previousColor[1]) && 
         Math.abs(this.nextColor[2]-this.previousColor[2])<=Math.abs(blueValue-this.previousColor[2])){
          this.updateNextColor();
      }
      else{
          this.currentColor = [redValue, greenValue, blueValue];
      }
  }

  addColor(color){
      this.colors.push(color)
  }

  removeColor(index){
      this.colors.splice(index,1)
      if(this.colors.length!=0){
          this.currentColor = this.colors[0];
          this.currentIndex = 0;
          this.updateNextColor();
      }
  }
  
  changeDelay(amount){
      this.delay = Math.max(Math.min(this.delay + amount,this.MAX_DELAY),this.MIN_DELAY)
      this.updateVelocities()
  }
}