import asyncio
import websockets
import os
import json
from collections import deque

# --- CONFIGURATION FOR SINGLE COMPUTER USE ---
HOST = 'localhost'  # Listen only on this computer
PORT = 2024         # Use a fixed port
# -------------------------------------------

LOG_DIR = "chat_logs"
HISTORY_LINES = 5

CLIENTS = {}
ROOMS = {}

# All helper functions remain the same and work perfectly
def ensure_log_directory():
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR); print(f"Created log directory: {LOG_DIR}")
def get_log_file_path(room):
    return os.path.join(LOG_DIR, f"{room}.txt")
async def log_message(room, message):
    with open(get_log_file_path(room), "a", encoding='utf-8') as f: f.write(message + "\n")
async def get_message_history(room):
    log_file = get_log_file_path(room)
    if not os.path.exists(log_file): return []
    with open(log_file, "r", encoding='utf-8') as f: return list(deque(f, maxlen=HISTORY_LINES))
async def broadcast(room, message, exclude_websocket=None):
    if room in ROOMS:
        tasks = [client.send(message) for client in ROOMS[room] if client != exclude_websocket]
        if tasks: await asyncio.gather(*tasks)
async def broadcast_state_update():
    if not CLIENTS: return
    room_state = {room: [CLIENTS[ws]["username"] for ws in websockets] for room, websockets in ROOMS.items()}
    update = json.dumps({"type": "state_update", "rooms": room_state})
    await asyncio.gather(*[client.send(update) for client in CLIENTS])
    print(f"📢 Broadcasted state update to {len(CLIENTS)} clients.")
async def handle_login(websocket, data):
    username, room = data.get("username"), data.get("room")
    if not username or not room: return None, None
    CLIENTS[websocket] = {"username": username, "room": room}
    ROOMS.setdefault(room, set()).add(websocket)
    print(f"✅ User '{username}' connected to room '{room}'.")
    history = await get_message_history(room)
    if history:
        history_messages = [json.loads(msg) for msg in history if msg.strip()]
        await websocket.send(json.dumps({"type": "history", "messages": history_messages}))
    announcement = json.dumps({"type": "announcement", "content": f"'{username}' has joined the room!"})
    await broadcast(room, announcement, exclude_websocket=websocket)
    await broadcast_state_update()
    return username, room
async def unregister_client(websocket):
    if websocket in CLIENTS:
        user_info = CLIENTS.pop(websocket)
        username, room = user_info["username"], user_info["room"]
        if room in ROOMS and websocket in ROOMS[room]:
            ROOMS[room].remove(websocket)
            if not ROOMS[room]: del ROOMS[room]
        print(f"🔌 User '{username}' from room '{room}' disconnected.")
        announcement = json.dumps({"type": "announcement", "content": f"'{username}' has left the room."})
        await broadcast(room, announcement)
        await broadcast_state_update()
async def chat_handler(websocket):
    username, room = None, None
    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type")
            if msg_type == "login": username, room = await handle_login(websocket, data)
            elif msg_type == "message" and username and room:
                chat_message = {"type": "message", "username": username, "content": data.get("content", "")}
                json_chat_message = json.dumps(chat_message)
                await log_message(room, json_chat_message)
                await broadcast(room, json_chat_message)
    except websockets.exceptions.ConnectionClosed: pass
    finally: await unregister_client(websocket)
async def start_server():
    ensure_log_directory()
    async with websockets.serve(chat_handler, HOST, PORT):
        print("--- NEON CHAT SERVER ---")
        print(f"🚀 Server is running on your computer at ws://{HOST}:{PORT}")
        print("   You can now open the index.html file.")
        print("--------------------------")
        await asyncio.Future()
if __name__ == "__main__":
    try: asyncio.run(start_server())
    except KeyboardInterrupt: print("\n🛑 Server is shutting down.")

