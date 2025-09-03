// DOM Elements
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');
const sidePanel = document.getElementById('side-panel');
const mainChatContent = document.getElementById('main-chat-content');
const currentRoomName = document.getElementById('current-room-name');
const memberList = document.getElementById('member-list');
const otherRoomsList = document.getElementById('other-rooms-list');
const chatTab = document.getElementById('chat-tab');
const infoTab = document.getElementById('info-tab');
const logoutButton = document.getElementById('logout-button');

let websocket = null;
let currentUserRoom = null;

// --- Login ---
loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const room = document.getElementById('room').value.trim();
    if (username && room) {
        currentUserRoom = room;
        connectWebSocket(username, room);
    }
});

// --- Sending Message ---
messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (message && websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: 'message', content: message }));
        messageInput.value = '';
    }
});

// --- Mobile Tabs ---
chatTab.addEventListener('click', () => {
    mainChatContent.classList.remove('hidden');
    sidePanel.classList.add('hidden');
    chatTab.classList.add('tab-active');
    infoTab.classList.remove('tab-active');
});

infoTab.addEventListener('click', () => {
    mainChatContent.classList.add('hidden');
    sidePanel.classList.remove('hidden');
    sidePanel.classList.add('flex');
    infoTab.classList.add('tab-active');
    chatTab.classList.remove('tab-active');
});

// --- Logout ---
logoutButton.addEventListener('click', () => {
    if (websocket) {
        websocket.close();
    }
});

// --- WebSocket ---
function connectWebSocket(username, room) {
    websocket = new WebSocket(`ws://localhost:2024`);

    websocket.onopen = () => {
        console.log('Connected to WebSocket server.');
        websocket.send(JSON.stringify({ type: 'login', username, room }));
        loginContainer.classList.add('hidden');
        chatContainer.classList.add('flex');
        chatContainer.classList.remove('hidden');
    };

    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch(data.type) {
            case 'state_update':
                updateSidePanel(data.rooms);
                break;
            case 'history':
                messagesContainer.innerHTML = '<div class="announcement text-sm">--- Message History ---</div>';
                data.messages.forEach(msg => displayMessage(msg));
                messagesContainer.innerHTML += '<div class="announcement text-sm">--- You are now live ---</div>';
                break;
            case 'message':
                displayMessage(data);
                break;
            case 'announcement':
                displayAnnouncement(data);
                break;
            case 'error':
                alert(`Error: ${data.message}`);
                break;
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    websocket.onclose = () => {
        console.log('Disconnected from WebSocket server.');
        chatContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');

        websocket = null;
        currentUserRoom = null;
        messagesContainer.innerHTML = '';
        memberList.innerHTML = '';
        otherRoomsList.innerHTML = '';
    };

    websocket.onerror = (error) => console.error('WebSocket Error:', error);
}

// --- Helpers ---
function updateSidePanel(rooms) {
    memberList.innerHTML = '';
    otherRoomsList.innerHTML = '';
    currentRoomName.textContent = currentUserRoom;

    for (const roomName in rooms) {
        const users = rooms[roomName];
        if (roomName === currentUserRoom) {
            users.forEach(user => {
                const memberLi = document.createElement('li');
                memberLi.textContent = user;
                memberLi.className = 'text-white-800 truncate p-1 rounded hover:bg-cyan-900/50';
                memberList.appendChild(memberLi);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = `${roomName} (${users.length} online)`;
            li.className = 'text-gray-400 truncate p-1 rounded hover:bg-cyan-900/50';
            otherRoomsList.appendChild(li);
        }
    }
}

function displayMessage(data) {
    const el = document.createElement('div');
    el.className = 'chat-message p-2 rounded-lg fade-in';
    el.innerHTML = `<strong class="text-blue-500">${data.username}:</strong> <span class="text-white">${data.content}</span>`;
    messagesContainer.appendChild(el);
}

function displayAnnouncement(data) {
    const el = document.createElement('div');
    el.className = 'announcement my-2 fade-in text-sm';
    el.textContent = data.content;
    messagesContainer.appendChild(el);
}
