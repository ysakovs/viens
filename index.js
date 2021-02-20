const express = require('express');
const socketio = require('socket.io');
const app = express();

// static folder
app.use(express.static(__dirname + '/public'));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server has started on port ${PORT}`));

const io = socketio(server);

// all connected users will be stored here
let sockets = [];

// all users that are searching will be stored here
let searching = [];

// all users that are currently chatting with another people will be stored here
let notAvailable = [];

io.on('connection', async socket => {
    // push current user in sockets
    sockets.push(socket);

    // get all users
    const allSockets = await io.allSockets();
    
    // emit the size of allSockets
    io.emit('numberOfOnline', allSockets.size);

    // a user searching for someone
    socket.on('start', id => {
        // remove socket in sockets and store it in searching array
        sockets = sockets.filter(s => {
            if(s.id === id) {
                searching.push(s);
                return;
            } else {
                return s;
            }
        });
        
        // loop through searching to find a user
        let i = 0;
        while(i < searching.length) {
            const peer = searching[i];

            // check if peer is not equal to current user's id
            if(peer.id !== id) {
                // remove peer and current user in searching array
                searching = searching.filter(s => s.id !== peer.id);
                searching = searching.filter(s => s.id !== id);
                
                // push current user and peer in notAvailable array
                notAvailable.push(socket, peer);

                // get the previous room name
                const socketRoomToLeave = [...socket.rooms][1];
                const peerRoomToLeave = [...peer.rooms][1];

                // leave the previos room
                socket.leave(socketRoomToLeave);
                peer.leave(peerRoomToLeave);

                // create new room name
                const roomName = `${id}#${peer.id}`;
                
                // join new room
                socket.join(roomName);
                peer.join(roomName);

                // emit message
                io.of('/').to(roomName).emit('chatStart', 'You are now chatting with a random stranger');

                // end of while loop
                break;
            }

            // send message to client that the server is still searching for someone
            socket.emit('searching', 'Searching...');

            i++;
        }
    });

    socket.on('newMessageToServer', msg => {
        // get room
        const roomName = [...socket.rooms][1];

        // send message to room
        io.of('/').to(roomName).emit('newMessageToClient', {id: socket.id, msg});
    });


       socket.on('typing', msg => {
        // get room
        const roomName = [...socket.rooms][1];

        // split ids
        const ids = roomName.split('#');

        // get peer id
        const peerId = ids[0] === socket.id ? ids[1] : ids[0];

        // get peer
        const peer = notAvailable.find(user => user.id === peerId);

        // emit message back to client
        peer.emit('strangerIsTyping', msg);
    });
    
    
    

    socket.on('stop', () => {
        // get room
        const roomName = [...socket.rooms][1];
        
        // get ids
        const ids = roomName.split('#');

        // get peer id
        const peerId = ids[0] === socket.id ? ids[1] : ids[0];
        
        // get peer
        const peer = notAvailable.find(user => user.id === peerId);

        // leave room
        peer.leave(roomName);
        socket.leave(roomName);

        // send message to peer
        peer.emit('strangerDisconnected', 'Stranger has disconnected');

        // send message to current user
        socket.emit('endChat', 'You have disconnected');

        // remove current user and peer in notAvailabe
        notAvailable = notAvailable.filter(user => user.id !== socket.id);
        notAvailable = notAvailable.filter(user => user.id !== peer.id);

        // add user and peer to sockets
        sockets.push(socket, peer);
    });

    socket.on('disconnecting', async () => {
        // get room
        const roomName = [...socket.rooms][1];

        // check if room exists
        if(roomName) {
            // send message to room
            io.of('/').to(roomName).emit('goodBye', 'Stranger has disconnected');

            // split id
            const ids = roomName.split('#');

            // get peer id
            const peerId = ids[0] === socket.id ? ids[1] : ids[0];

            // get peer
            const peer = notAvailable.find(user => user.id === peerId);

            // leave room
            peer.leave(roomName);

            // remove peer to notAvailable
            notAvailable = notAvailable.filter(user => user.id !== peerId);

            // add peer to sockets
            sockets.push(peer);
        }

        // remove the current user in sockets, searching, and notAvailable array if the user disconnects
        sockets = sockets.filter(user => user.id !== socket.id);
        searching = searching.filter(user => user.id !== socket.id);
        notAvailable = notAvailable.filter(user => user.id !== socket.id);
    });

    socket.on('disconnect', async () => {
        // get all users
        const allSockets = await io.allSockets();
    
        // emit the size of allSockets
        io.emit('numberOfOnline', allSockets.size);
    });
});
