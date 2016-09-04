var RFB = require( 'rfb2' );
var Png = require('../node_modules/png/build/Release/png').Png;

var clients = [],
	express = require( 'express' ),
	http = require( 'http' ),
	Config = {
		HTTP_PORT: 8090
	};

/**
* Creates RFB connection
*/
function createRfbConnection( config, socket ) {
	try {
		var r = RFB( {
			host: config.hostname,
			port: config.port,
			password: config.password,
			securityType: 'vnc',
		});
	} catch( err ) {
		console.log( err );
	}
	addEventHandlers( r, socket );

	return r;
}

/**
* Adds event handlers, which should handle RFB events
*/
function addEventHandlers( r, socket ) {
	var initialized = false,
		screenWidth, screenHeight;

	//notify AngularJS we're connected to VNC and add clients to clients list
	function handleConnection( width, height ) {
		screenWidth = width;
		screenHeight = height;
		console.info( 'RFB connection established' );
		socket.emit( 'init', {
			width: width,
			height: height
		});
		clients.push({
			socket: socket,
			rfb: r,
			interval: setInterval( function() {
				r.requestRedraw();
			}, 1000)
		});
		r.requestRedraw();
		initialized = true;
	}

	r.on( 'error', function() {
		console.error( 'Error while talking with the remote RFB server' );
	});

	r.on( 'raw'. function( rect ) {
		if ( !initialized ) {
		  handleConnection( rect.width, rect.height );
		}

		socket.emit( 'frame', {
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
			image: encodeFrame( rect ).toString( 'base64' )
		});

		r.requestUpdate({
			x: 0,
			y: 0,
			subscribe: 1,
			width: screenWidth,
			height: screenHeight
		});
	});

	r.on( '*', function() {
		console.error( arguments );
	});
}

/**
* Order the pixels and convert to PNG
*/
function encodeFrame( rect ) {
	var rgb = new Buffer ( rect.width * rect.height * 3, 'binary' ),
		offset = 0;

	for( var i = 0; i < rect.fb.length; i += 4 ) {
		rgb[ offset++ ] = rect.fb[ i + 2 ];
		rgb[ offset++ ] = rect.fb[ i + 1 ];
		rgb[ offset++ ] = rect.fb[ i ];
	}

	var image =  new Png( rgb, rect.width, rect.height, 'rgb' );
	return image.encodeSync();
}

/**
* Find the client in array and disconnect him
*/
function disconnectClient( socket ) {
	clients.forEach( function( client ) {
		if( client.socket === socket ) {
			client.rfb.end();
			clearInterval( client.interval );
		}
	});

	clients = clients.filter( function( client ) {
		return client.socket === socket;
	});
}

/**
* Main function
*/
exports.run = function() {
	var app = express(),
		server = http.createServer( app );

	app.use( express.static( __dirname + '/../../client/app' ) );
	server.listen( Config.HTTP_PORT );

	console.info( 'Server listening on port: ', Config.HTTP_PORT );

	io = io.listen( server, { log:false } );
	io.sockets.on( 'connection', function( socket ) {
		console.info( 'Client has connected' );
		socket.on( 'init', function( config ) {
			var r = createRfbConnection( config, socket );
			//grab mouse events
			socket.on( 'mouse', function( ev ) {
				r.sendPointer( ev.x, ev.y, ev.button );
			});
			//grab keyboard events
			socket.on( 'keyboard', function( ev ) {
				r.sendKey( ev.keyCode, ev.isDown );
				console.info( 'Keyboard input' );
			});
			//monitor disconnect
			socket.on( 'disconnect', function() {
				disconnectClient( socket );
				console.info( 'Client has disconnected' );
			});
		});
	});
};