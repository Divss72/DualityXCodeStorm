import asyncio
import websockets
import json
import base64
import random
import time

# CONFIGURATION
# Replace this with the IP address of the machine running the relay server
RELAY_URL = "ws://172.22.212.34:8080"

async def ai_service():
    print(f"🔌 Connecting to Relay Server at {RELAY_URL}...")
    
    async with websockets.connect(RELAY_URL) as websocket:
        # 1. Register as a 'dashboard' to RECEIVE frames
        # (The relay broadcasts frames to all dashboards)
        try:
            await websocket.send(json.dumps({
                "type": "register",
                "clientType": "dashboard"
            }))
            print("✅ Registered as Dashboard (Video Receiver)")
        except Exception as e:
            print(f"❌ Registration failed: {e}")
            return

        print("🧠 AI Bridge Active - Waiting for frames...")

        async for message in websocket:
            try:
                msg = json.loads(message)
                
                if msg.get("type") == "frame":
                    role = msg.get("role")
                    # frame_data = msg.get("data") # Base64 string of the image
                    
                    # --- SIMULATE AI PROCESSING ---
                    # In a real app, you would:
                    # 1. Decode base64 to image (OpenCV)
                    # 2. Run YOLO/Segmentation
                    # 3. Generate result
                    
                    # For this demo, we just generate mock data immediately
                    # but only send it occasionally to simulate load
                    if random.random() < 0.2: # 20% chance per frame to send update
                        
                        # Mock Analysis Payload matching PerceptionData interface
                        analysis = {
                            "type": "scene_analysis",
                            "role": role,
                            "data": {
                                "camera": role,
                                "timestamp": msg.get("timestamp") or time.time() * 1000,
                                "confidence": round(random.uniform(0.7, 0.99), 2),
                                "summary_text": f"Detected object in {role} feed.",
                                "alerts": [{"code": "CAUTION_OBSTACLE", "severity": "medium", "message": "Obstacle nearby"}] if random.random() > 0.8 else [],
                                "segmentation": {
                                    "road": round(random.uniform(40, 60), 1),
                                    "obstacle": round(random.uniform(5, 20), 1),
                                    "vegetation": round(random.uniform(10, 30), 1)
                                }
                            }
                        }
                        
                        await websocket.send(json.dumps(analysis))
                        print(f"🚀 Sent analysis for {role}")

            except Exception as e:
                print(f"❌ Error: {e}")

if __name__ == "__main__":
    try:
        print("Starting AI Bridge...")
        print("Make sure you have installed websockets: pip install websockets")
        asyncio.run(ai_service())
    except KeyboardInterrupt:
        print("\n🛑 AI Bridge Stopped")
    except Exception as e:
        print(f"\n❌ Fatal Error: {e}")
