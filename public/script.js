// connect to main namespace
const socket = io('/');

const conversation = document.querySelector('.conversation');

let alreadyTyping = false;

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
    submitMessage();
});

// event listener when user press enter key
document.querySelector('#text').onkeydown = e => {
    // enter key is pressed without shift key
    if(e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault();
        submitMessage();
    }
}

// event listener when user is typing
document.querySelector('#text').addEventListener('input', e => {
    if(!alreadyTyping) {
        // emit message to server that a stranger is typing
        socket.emit('typing', 'Stranger is typing...');

        alreadyTyping = true;
    }

    // check if user is not typing
    if(e.target.value === '') {
        socket.emit('doneTyping');

        alreadyTyping = false;
    }
});

// event listener when textarea is not focused
document.querySelector('#text').addEventListener('blur', () => {
    socket.emit('doneTyping');

    alreadyTyping = false;
});

// event listener when textarea is clicked
document.querySelector('#text').addEventListener('click', e => {
    // check if value is not empty
    if(e.target.value !== '') {
        // emit message to server that a stranger is typing
        socket.emit('typing', 'Stranger is typing...');

        alreadyTyping = true;
    }
});

// receive the message from server then add it to html
socket.on('newMessageToClient', data => {
    const notStranger = data.id === socket.id;

    conversation.innerHTML += `
        <div class="chat">
            <span class="${notStranger ? 'name blue' : 'name red'}">${notStranger ? 'You: ' : 'Stranger: '} </span>
            <span class="text">${data.msg}</span>
        </div>
    `;

    // scroll to the bottom of the conversation
    conversation.scrollTo(0, conversation.scrollHeight);
});

// message when someome is typing
socket.on('strangerIsTyping', msg => {
    // add the message to html
    conversation.innerHTML += conversation.innerHTML = `<div class="message typing">${msg}</div>`;

    // scroll conversation to bottom
    conversation.scrollTo(0, conversation.scrollHeight);
});

// remove the Stranger is typing... message
socket.on('strangerIsDoneTyping', () => {
    const typing = document.querySelector('.typing');

    if(typing) {
        typing.remove();
    }
});

// message when someone disconnect
socket.on('goodBye', msg => {
    conversation.innerHTML += `<div class="message">${msg}</div>`;

    reset();
});

// stop button
document.querySelector('#stop').addEventListener('click', () => {
    // hide stop button
    document.querySelector('#stop').classList.add('hide');

    // show really button
    document.querySelector('#really').classList.remove('hide');
});

// really button
document.querySelector('#really').addEventListener('click', () => {
    // stop conversation
    socket.emit('stop');
});

// display message when stranger disconnect
socket.on('strangerDisconnected', msg => {
    conversation.innerHTML += `<div class="message">${msg}</div>`;

    reset();
});

// display message when current user disconnect
socket.on('endChat', msg => {
    conversation.innerHTML += `<div class="message">${msg}</div>`;

    reset();
});

function submitMessage() {
    // get the input
    const input = document.querySelector('#text');

    // check if input is not an empty string
    if(/\S/.test(input.value)) {
        // emit to server that the user is done typing
        socket.emit('doneTyping');

        // emit the value of input to server
        socket.emit('newMessageToServer', input.value);

        // clear the value of input
        input.value = '';

        // set alreadyTyping back to false
        alreadyTyping = false;
    }
}

function reset() {
    // remove the hide class of start  button
    document.querySelector('#start').classList.remove('hide');

    // hide stop button
    document.querySelector('#stop').classList.add('hide');

    // hide really button
    document.querySelector('#really').classList.add('hide');

    const text = document.querySelector('#text');

    // add disabled attribute in textarea
    text.disabled = true;

    text.value = '';

    // add disabled attribute in send button
    document.querySelector('#send').disabled = true;

    // remove Stranger is typing... message if exists
    const typing = document.querySelector('.typing');

    if(typing) {
        typing.remove();
    }

    alreadyTyping = false;

    // scroll conversation to bottom
    conversation.scrollTo(0, conversation.scrollHeight);
}