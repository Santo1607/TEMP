# ESP32 WebSocket Temperature Streaming Setup

This guide shows how to configure the ESP32 to stream real-time temperature data to your web app via WebSocket.

## Required Libraries

Install these additional libraries in Arduino IDE:

1. **WebSocketsClient** by Markus Sattler
   - Search for "WebSocketsClient" in Library Manager
   - Install the latest version

2. **ArduinoJson** by Benoit Blanchon
   - Search for "ArduinoJson" in Library Manager
   - Install version 6.x or later

## Configuration Steps

1. **Update WiFi Credentials**
   ```cpp
   #define WIFI_SSID "YOUR_SSID"
   #define WIFI_PASSWORD "YOUR_PASSWORD"
   ```

2. **Update Server Details**
   ```cpp
   #define SERVER_HOST "your-app.replit.dev"  // Your Replit app URL
   #define SERVER_PORT 443                     // HTTPS WebSocket
   #define SERVER_PATH "/ws/temperature"
   ```

3. **Device Configuration**
   ```cpp
   const char* deviceId = "ESP32-MLX90614-01";  // Unique identifier
   ```

## How It Works

### Arduino Side
1. Connects to WiFi
2. Establishes WebSocket connection to backend
3. Reads MLX90614 sensor every 500ms
4. Sends temperature data to server every 2 seconds via JSON

### Message Format
```json
{
  "type": "temperature",
  "deviceId": "ESP32-MLX90614-01",
  "timestamp": 12345678,
  "ambientTemp": 24.5,
  "objectTemp": 32.1,
  "wifi": "connected"
}
```

### Backend
- Receives messages via WebSocket
- Broadcasts to all connected dashboard clients
- Stores in memory for latest data
- Can optionally store in database

### Frontend
- Connects to WebSocket server
- Displays real-time updates on dashboard
- Shows color-coded temperature status
- Tracks connection status

## Testing

### Arduino Serial Monitor
1. Open Serial Monitor at 115200 baud
2. You should see:
   ```
   Connecting to WiFi: YOUR_SSID
   WiFi connected!
   IP address: 192.168.1.100
   WebSocket setup complete. Connecting...
   [WebSocket] Connected!
   [WebSocket] Handshake from ESP32-MLX90614-01: ESP32 Temperature Sensor
   Sent: {"type":"temperature","deviceId":"ESP32-MLX90614-01",...}
   ```

### Dashboard
1. Navigate to `/dashboard` in your web app
2. Look for "Real-time Temperature Monitoring" section
3. You should see:
   - Connection status (Connected/Disconnected)
   - Ambient temperature in real-time
   - Object temperature in real-time
   - Temperature status (Normal, Fever, etc.)
   - Device information
   - Recent activity log

## OLED Display Status

The OLED shows connection status:
- `W:OK` - WiFi connected
- `W:XX` - WiFi disconnected
- `WS:OK` - WebSocket connected
- `WS:XX` - WebSocket disconnected

## Troubleshooting

### WebSocket Connection Failed
- Check WiFi is working first
- Verify server URL is correct (no `wss://` prefix, it's automatic)
- Check firewall isn't blocking WebSocket on port 443
- Try HTTP (port 80) instead of HTTPS for development

### Data Not Showing on Dashboard
- Check browser console for errors (F12 → Console)
- Verify Arduino serial monitor shows successful connection
- Check network tab to see WebSocket connection
- Look for console output from backend

### WiFi Connection Issues
- Verify SSID and password are correct
- Ensure ESP32 is within WiFi range
- Try restarting the ESP32

### ArduinoJson Compilation Errors
- Make sure ArduinoJson 6.x is installed (not 5.x)
- Check Library Manager shows latest version

## SSL/TLS Security

The code uses self-signed certificate allowance for development. For production:
1. Use a proper SSL certificate
2. Remove `.setInsecure()` call
3. Configure certificate verification properly

## Performance Notes

- Sensor update interval: 500ms (configurable)
- WebSocket send interval: 2000ms (configurable)
- OLED update: Real-time as data arrives
- Browser dashboard updates in real-time via WebSocket

## Next Steps

1. Upload the sketch to your ESP32
2. Check Arduino serial monitor for connection status
3. Navigate to dashboard in your web app
4. Watch temperature data stream in real-time!

## Advanced Customization

### Change Send Interval
```cpp
const unsigned long WEBSOCKET_SEND_INTERVAL = 5000; // 5 seconds instead of 2
```

### Change Sensor Read Interval
```cpp
const unsigned long SENSOR_UPDATE_INTERVAL = 1000; // 1 second instead of 0.5
```

### Handle Server Commands
Add custom commands to the WebSocket message handler:
```cpp
const char* cmd = doc["command"];
if (strcmp(cmd, "get_status") == 0) {
  // Send status response
}
```
