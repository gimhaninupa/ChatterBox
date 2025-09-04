ChatterBox Real-Time Chat (WebSocket Based)
Overview
This project is a real-time chat room application built using Python for the backend and HTML, CSS, and JavaScript for the frontend. The backend leverages asyncio and the websockets library to manage connections and message broadcasting. It supports multiple rooms and user nicknames (usernames). When a new user joins, a history of recent messages is displayed. The system features a responsive design with a dedicated mobile view to ensure usability across different devices.

Features
Real-time Communication: Utilizes WebSockets for bidirectional communication between the server and clients.

Multiple Chat Rooms: Users can join distinct chat rooms by specifying a room name during login.

User Presence: Displays a list of members currently in the user's room and a list of other available rooms.

Message History: Loads and displays recent chat history to users upon joining a room. The server is configured to retrieve a specific number of historical lines.

Responsive Frontend: The interface adapts to different screen sizes, with a tabbed layout for mobile devices to switch between the chat view and the info panel.

System Announcements: Broadcasts system messages when a user joins or leaves a room.

Tech Stack
Backend: Python 3, asyncio, websockets library

Frontend: HTML5, CSS3 (including Tailwind CSS), Vanilla JavaScript

Protocol: WebSocket
