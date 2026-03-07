from flask import Flask, Response, render_template_string
import threading
import asyncio
import websockets
import json
import time

# CONFIGURATION
# IP of the machine running the Dashboard/Relay
RELAY_HOST = "172.22.212.34" 
RELAY_PORT = 8080
RELAY_URL = f"ws://{RELAY_HOST}:{RELAY_PORT}"

app = Flask(__name__)

# Store latest frames: role -> base64_string
latest_frames = {
    "front": None,
    "rear": None,
    "left": None,
    "right": None
}

def websocket_listener():
    """Background thread to receive frames from Relay"""
    async def listen():
        print(f"🔌 Connecting to Relay at {RELAY_URL}...")
        while True:
            try:
                async with websockets.connect(RELAY_URL) as ws:
                    # Register as dashboard to receive frames
                    await ws.send(json.dumps({
                        "type": "register",
                        "clientType": "dashboard"
                    }))
                    print("✅ Connected! Waiting for frames...")
                    
                    async for message in ws:
                        try:
                            msg = json.loads(message)
                            if msg.get("type") == "frame" and msg.get("data"):
                                role = msg.get("role")
                                # Format is "data:image/jpeg;base64,..."
                                # We strip the header for raw decoding if needed, 
                                # but for browser display keeping header is fine,
                                # actually for MJPEG we need binary.
                                b64_data = msg.get("data").split(",")[1] 
                                latest_frames[role] = b64_data
                        except Exception as e:
                            print(f"Error parsing: {e}")
                            
            except Exception as e:
                print(f"❌ Connection error: {e}. Retrying in 2s...")
                await asyncio.sleep(2)

    asyncio.run(listen())

def generate_frames(role):
    """Generator for MJPEG stream"""
    while True:
        frame_b64 = latest_frames.get(role)
        if frame_b64:
            import base64
            try:
                frame_bytes = base64.b64decode(frame_b64)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            except:
                pass
        time.sleep(0.03) # Limit to ~30 FPS polling

@app.route('/')
def index():
    return render_template_string("""
    <html>
    <head>
        <title>UGV Remote Viewer</title>
        <style>
            body { background: #111; color: white; font-family: sans-serif; text-align: center; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 20px; }
            .cam { background: #222; padding: 10px; border-radius: 8px; }
            img { width: 100%; border-radius: 4px; border: 1px solid #444; }
            h2 { margin: 5px 0; color: #888; text-transform: uppercase; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <h1>🔭 Remote Video Feed</h1>
        <div class="grid">
            <div class="cam"><h2>Front</h2><img src="/video_feed/front"></div>
            <div class="cam"><h2>Rear</h2><img src="/video_feed/rear"></div>
            <div class="cam"><h2>Left</h2><img src="/video_feed/left"></div>
            <div class="cam"><h2>Right</h2><img src="/video_feed/right"></div>
        </div>
    </body>
    </html>
    """)

@app.route('/video_feed/<role>')
def video_feed(role):
    return Response(generate_frames(role),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    # Start WebSocket thread
    t = threading.Thread(target=websocket_listener, daemon=True)
    t.start()
    
    print("🚀 Flask Viewer running on http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
