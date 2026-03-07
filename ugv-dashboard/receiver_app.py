import http.server
import socketserver
import json
import os

PORT = 8000
DATA_FILE = "backend.txt"

class JSONRequestHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 1. Read content length
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.end_headers()
                return

            # 2. Read and decode data
            post_body = self.rfile.read(content_length)
            data = json.loads(post_body.decode('utf-8'))
            
            # 3. Save to file (Atomic write)
            print(f"📩 Received data. Saving to {DATA_FILE}...")
            
            temp_file = DATA_FILE + ".tmp"
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
            
            if os.path.exists(DATA_FILE):
                os.replace(temp_file, DATA_FILE)
            else:
                os.rename(temp_file, DATA_FILE)

            # 4. Forward to Dashboard (Relay)
            try:
                # Build WebSocket message
                # If data matches expected structure, use it. Else wrap it.
                ws_message = {
                    "type": "scene_analysis",
                    "role": "external", # Identifier
                    "data": data  # The payload from 172.22.211.250
                }
                
                import websocket # Requires: pip install websocket-client
                ws = websocket.create_connection("ws://127.0.0.1:8080", timeout=2) # Sync connection
                
                # Register first (Good practice for relay)
                ws.send(json.dumps({"type": "register", "clientType": "camera", "role": "external_ai"}))
                
                # Send Data
                ws.send(json.dumps(ws_message))
                ws.close()
                print("📡 Forwarded to Dashboard")
                
            except Exception as e:
                print(f"⚠️ Failed to forward to Dashboard: {e}")

            # 5. Send Response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "success", "forwarded": true}')

        except Exception as e:
            print(f"Error: {e}")
            self.send_response(500)
            self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Receiver + Relay Bridge Running.")

if __name__ == "__main__":
    print(f"🚀 Receiver & Bridge running on port {PORT}")
    print(f"📂 Writes to: {DATA_FILE}")
    print(f"📡 Forwards to: ws://127.0.0.1:8080")
    print("Use Ctrl+C to stop")
    
    # Allow address reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("0.0.0.0", PORT), JSONRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Stopping receiver.")
