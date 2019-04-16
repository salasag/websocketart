var express = require('express');
var socket = require('socket.io');
var port = process.env.PORT || 3000;
var app = express();
var server = app.listen(port);

app.use(express.static('public')); 

var io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket){
	console.log('new connection' + socket.id);

	socket.on('mouse', mouseMsg);
	function mouseMsg(data){
	    socket.broadcast.emit('mouse', data);
	    //io.sockets.emit(mouse, data)
		console.log(data)
	}
}








