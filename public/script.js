// connect to main namespace
const socket = io('/');

const conversation = document.querySelector('.conversation');

// change the number of online
socket.on('numberOfOnline', size => {
    document.querySelector('.online').innerHTML = `${size.toLocaleString()} online now`
});

// event listener for search
document.querySelector('#start').addEventListener('click', () => {
    // searching for someone to talk to
    socket.emit('start', socket.id);
});

// display searching message
socket.on('searching', msg => {
    // add the searching message to our html
    conversation.innerHTML = `<div class="message">${msg}</div>`;
});

// found someone
// start of their chat
socket.on('chatStart', msg => {
    // add the message to our html that a user has found
    conversation.innerHTML = `<div class="message">${msg}</div>`;

    // remove the hide class of stop button
    document.querySelector('#stop').classList.remove('hide');

    // hide start button
    document.querySelector('#start').classList.add('hide');

    // remove disabled attribute in textarea
    document.querySelector('#text').disabled = false;

    // remove disabled attribute in send button
    document.querySelector('#send').disabled = false;
});

// event listener for form submit
document.querySelector('.form').addEventListener('submit', e => {
    e.preventDefault();
    // get the input
    const input = document.querySelector('#text');
    // emit the value of input to server
    socket.emit('newMessageToServer', input.value);
    // clear the value of input
    input.value = '';
});

// receive the message from server then add it to html
socket.on('newMessageToClient', data => {
    const notStranger = data.id === socket.id;

    conversation.innerHTML += `
        <div class="chat">
            <span class="${notStranger ? 'name blue' : 'name red'}">${notStranger ? 'You: ' : 'Stranger: '} </span>
            <span class="text">${data.msg}</span>
        </div>
    `
});

// message when someone disconnect
socket.on('goodBye', msg => {
    conversation.innerHTML += `<div class="message">${msg}</div>`;

    // add disabled attribute in textarea
    document.querySelector('#text').disabled = true;

    // add disabled attribute in send button
    document.querySelector('#send').disabled = true;

    // hide stop button
    document.querySelector('#stop').classList.add('hide');

    // remove the hide class of start  button
    document.querySelector('#start').classList.remove('hide');
});

// end chat
document.querySelector('#stop').addEventListener('click', () => {
    // stop conversation
    socket.emit('stop');
});

// display message when stranger disconnect
socket.on('strangerDisconnected', msg => {
    conversation.innerHTML += `<div class="message">${msg}</div>`;

     // remove the hide class of start  button
     document.querySelector('#start').classList.remove('hide');

     // hide stop button
     document.querySelector('#stop').classList.add('hide');

     // add disabled attribute in textarea
    document.querySelector('#text').disabled = true;

    // add disabled attribute in send button
    document.querySelector('#send').disabled = true;
});

// display message when current user disconnect
socket.on('endChat', msg => {
    conversation.innerHTML += `<div class="message">${msg}</div>`;

     // remove the hide class of start  button
     document.querySelector('#start').classList.remove('hide');

     // hide stop button
     document.querySelector('#stop').classList.add('hide');

     // add disabled attribute in textarea
    document.querySelector('#text').disabled = true;

    // add disabled attribute in send button
    document.querySelector('#send').disabled = true;
});