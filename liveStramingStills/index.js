/**
 * Created by Ruslan on 8/1/2017.
 */

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let fs = require('fs');
let path = require('path');
let spawn = require('child_process').spawn;
let proc;

app.use('/', express.static(path.join(__dirname, 'stream')));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

let sockets = {};

io.on('connection', function(socket) {

    sockets[socket.id] = socket;
    console.log("Total clients connected : ", Object.keys(sockets).length);

    socket.on('disconnect', function() {
        delete sockets[socket.id];

        // no more sockets, kill the stream
        if (Object.keys(sockets).length === 0) {
            app.set('watchingFile', false);
            if (proc) proc.kill();
            fs.unwatchFile('./stream/image_stream.jpg');
        }
    });

    socket.on('start-stream', function() {
        startStreaming(io);
    });

});

http.listen(3000, function() {
    console.log('listening on *:3000');
});

function stopStreaming() {
    if (Object.keys(sockets).length === 0) {
        app.set('watchingFile', false);
        if (proc) proc.kill();
        fs.unwatchFile('./stream/image_stream.jpg');
    }
}

function startStreaming(io) {

    if (app.get('watchingFile')) {
        io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
        return;
    }

    let args = ["-w", "640", "-h", "480", "-o", "./stream/image_stream.jpg", "-t", "999999999", "-tl", "100"];
    proc = spawn('raspistill', args);

    console.log('Watching for changes...');

    app.set('watchingFile', true);

    fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
        io.sockets.emit('liveStream', 'image_stream.jpg?_t=' + (Math.random() * 100000));
    })

}
