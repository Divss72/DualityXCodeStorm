const { WebSocketServer, WebSocket } = require('ws');

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// Store connected clients by role
const clients = {
    dashboard: new Set(),
    cameras: new Map() // role -> ws
};

console.log(`📡 Camera Relay Server running on ws://0.0.0.0:${PORT}`);

wss.on('connection', (ws) => {
    let clientType = null;
    let cameraRole = null;

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());

            // Registration message
            if (msg.type === 'register') {
                clientType = msg.clientType;

                if (clientType === 'dashboard') {
                    clients.dashboard.add(ws);
                    console.log('✅ Dashboard connected');

                    // Send current camera statuses
                    const statuses = {};
                    clients.cameras.forEach((_, role) => {
                        statuses[role] = true;
                    });
                    ws.send(JSON.stringify({ type: 'camera_status', statuses }));

                } else if (clientType === 'camera') {
                    cameraRole = msg.role;
                    clients.cameras.set(cameraRole, ws);
                    console.log(`📷 Camera connected: ${cameraRole}`);

                    // Notify dashboards
                    broadcastToDashboards({
                        type: 'camera_connected',
                        role: cameraRole
                    });
                }
            }

            // Frame from camera
            if (msg.type === 'frame' && clientType === 'camera') {
                // Relay to all dashboards
                broadcastToDashboards({
                    type: 'frame',
                    role: cameraRole,
                    data: msg.data,
                    timestamp: Date.now()
                });
            }

            // AI Analysis relay
            if (msg.type === 'scene_analysis') {
                broadcastToDashboards(msg);
            }

        } catch (err) {
            console.error('Message parse error:', err);
        }
    });

    ws.on('close', () => {
        if (clientType === 'dashboard') {
            clients.dashboard.delete(ws);
            console.log('❌ Dashboard disconnected');
        } else if (clientType === 'camera' && cameraRole) {
            clients.cameras.delete(cameraRole);
            console.log(`❌ Camera disconnected: ${cameraRole}`);

            // Notify dashboards
            broadcastToDashboards({
                type: 'camera_disconnected',
                role: cameraRole
            });
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

function broadcastToDashboards(message) {
    const data = JSON.stringify(message);
    clients.dashboard.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

console.log(`
🚀 Ready! 

Phone:     Connect to ws://YOUR_IP:${PORT} as camera
Dashboard: Connect to ws://YOUR_IP:${PORT} as dashboard
`);
