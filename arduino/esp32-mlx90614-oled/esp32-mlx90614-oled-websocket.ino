#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
#define WIFI_SSID "YOUR_SSID"
#define WIFI_PASSWORD "YOUR_PASSWORD"

// Server Configuration
#define SERVER_HOST "your-app.replit.dev"  // Your Replit app URL
#define SERVER_PORT 443                     // HTTPS WebSocket
#define SERVER_PATH "/ws/temperature"

// OLED display parameters
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// I2C pins for ESP32
#define SDA_PIN 21
#define SCL_PIN 22

// Create instances
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
WebSocketsClient webSocket;

// Variables
float ambientTemp = 0.0;
float objectTemp = 0.0;
unsigned long lastUpdateTime = 0;
unsigned long lastWebSocketSend = 0;
const unsigned long SENSOR_UPDATE_INTERVAL = 500;   // Read sensor every 500ms
const unsigned long WEBSOCKET_SEND_INTERVAL = 2000; // Send to server every 2s
bool wifiConnected = false;
bool webSocketConnected = false;
const char* deviceId = "ESP32-MLX90614-01";  // Unique device identifier

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\nESP32 MLX90614 + OLED + WebSocket Temperature Monitor");
  Serial.println("=====================================================\n");

  // Initialize I2C with custom pins
  Wire.begin(SDA_PIN, SCL_PIN);
  delay(100);

  // Initialize OLED display
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;) delay(10);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();
  delay(2000);

  // Initialize MLX90614
  if (!mlx.begin()) {
    Serial.println("MLX90614 not found!");
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("MLX90614 Error!");
    display.println("Check connections");
    display.display();
    while (1) delay(10);
  }
  
  Serial.println("MLX90614 initialized successfully");
  Serial.println("OLED initialized successfully");
  
  // Initialize WiFi
  initWiFi();
  
  // Setup WebSocket
  setupWebSocket();
  
  display.clearDisplay();
  display.display();
}

void loop() {
  // Handle WebSocket connection
  webSocket.loop();

  unsigned long currentTime = millis();
  
  // Update sensor readings at intervals
  if (currentTime - lastUpdateTime >= SENSOR_UPDATE_INTERVAL) {
    lastUpdateTime = currentTime;
    
    // Read temperatures from MLX90614
    ambientTemp = mlx.readAmbientTempC();
    objectTemp = mlx.readObjectTempC();
    
    // Print to Serial
    Serial.print("Ambient: ");
    Serial.print(ambientTemp);
    Serial.print("C | Object: ");
    Serial.print(objectTemp);
    Serial.print("C | WiFi: ");
    Serial.print(wifiConnected ? "OK" : "No");
    Serial.print(" | WebSocket: ");
    Serial.println(webSocketConnected ? "Connected" : "Disconnected");
  }
  
  // Send data to server at intervals
  if (currentTime - lastWebSocketSend >= WEBSOCKET_SEND_INTERVAL && webSocketConnected) {
    lastWebSocketSend = currentTime;
    sendTemperatureData();
  }
  
  // Update OLED display
  updateDisplay();
  
  delay(50);
}

// ============================================================================
// WiFi Functions
// ============================================================================

void initWiFi() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    wifiConnected = false;
    Serial.println("\nFailed to connect to WiFi");
  }
}

// ============================================================================
// WebSocket Functions
// ============================================================================

void setupWebSocket() {
  // Set SSL/TLS
  webSocket.setSecure(true);  // Use wss:// for secure connection
  
  // Connect to WebSocket server
  webSocket.begin(SERVER_HOST, SERVER_PORT, SERVER_PATH);
  
  // Set event handlers
  webSocket.onEvent(webSocketEvent);
  
  // Allow self-signed certificates (for development)
  webSocket.setInsecure();
  
  Serial.println("WebSocket setup complete. Connecting...");
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Disconnected!");
      webSocketConnected = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("[WebSocket] Connected!");
      webSocketConnected = true;
      
      // Send initial handshake
      DynamicJsonDocument doc(256);
      doc["type"] = "handshake";
      doc["deviceId"] = deviceId;
      doc["deviceName"] = "ESP32 Temperature Sensor";
      doc["version"] = "1.0";
      
      String json;
      serializeJson(doc, json);
      webSocket.sendTXT(json);
      break;
      
    case WStype_TEXT:
      Serial.print("[WebSocket] Received: ");
      Serial.println((char*) payload);
      
      // Parse incoming JSON command (e.g., alert settings)
      DynamicJsonDocument doc(256);
      DeserializationError error = deserializeJson(doc, payload, length);
      
      if (!error) {
        const char* cmd = doc["command"];
        if (strcmp(cmd, "ping") == 0) {
          // Respond to ping
          DynamicJsonDocument response(128);
          response["type"] = "pong";
          response["deviceId"] = deviceId;
          response["timestamp"] = millis();
          
          String json;
          serializeJson(response, json);
          webSocket.sendTXT(json);
        }
      }
      break;
      
    case WStype_ERROR:
      Serial.println("[WebSocket] Error!");
      webSocketConnected = false;
      break;
      
    default:
      break;
  }
}

void sendTemperatureData() {
  if (!webSocketConnected) {
    Serial.println("WebSocket not connected, cannot send data");
    return;
  }
  
  // Create JSON payload
  DynamicJsonDocument doc(256);
  doc["type"] = "temperature";
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  doc["ambientTemp"] = round(ambientTemp * 10) / 10.0;  // Round to 1 decimal
  doc["objectTemp"] = round(objectTemp * 10) / 10.0;
  doc["wifi"] = "connected";
  
  String json;
  serializeJson(doc, json);
  
  webSocket.sendTXT(json);
  Serial.print("Sent: ");
  Serial.println(json);
}

// ============================================================================
// Display Functions
// ============================================================================

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(10, 0);
  display.println("Temperature Monitor");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Ambient Temperature (large display)
  display.setTextSize(2);
  display.setCursor(0, 18);
  display.print("Amb: ");
  display.print(ambientTemp, 1);
  display.println("C");
  
  // Object Temperature (large display)
  display.setCursor(0, 40);
  display.print("Obj: ");
  display.print(objectTemp, 1);
  display.println("C");
  
  // Status bar
  display.setTextSize(1);
  display.drawLine(0, 58, SCREEN_WIDTH, 58, SSD1306_WHITE);
  display.setCursor(0, 60);
  
  // WiFi indicator
  display.print("W:");
  display.print(wifiConnected ? "OK" : "XX");
  display.print(" | ");
  
  // WebSocket indicator
  display.print("WS:");
  display.print(webSocketConnected ? "OK" : "XX");
  
  display.display();
}
