var socket;
var kanye;
var kim;

function preload(){
  kanye = loadImage("assets/kanye.png");
  kim = loadImage("assets/kim.png");
}

function setup(){

   createCanvas(windowWidth, windowHeight);

   socket = io.connect();
   socket.on('mouse', newDrawing);
}

function newDrawing(data){
  image(kanye, data.x, data.y, 200, 300);
}

function mouseDragged(){
	console.log(mouseX + ' ' + mouseY);

	var data = {
		x: mouseX, 
		y: mouseY
	}

	socket.emit('mouse', data);

  image(kim, mouseX, mouseY, 200, 300);
}