#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

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

// Variables
float ambientTemp = 0.0;
float objectTemp = 0.0;
unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 500; // Update every 500ms

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\nESP32 MLX90614 + OLED Temperature Display");
  Serial.println("==========================================\n");

  // Initialize I2C with custom pins
  Wire.begin(SDA_PIN, SCL_PIN);
  delay(100);

  // Initialize OLED display
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;); // Halt
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
  
  display.clearDisplay();
  display.display();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Update sensor readings at intervals
  if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
    lastUpdateTime = currentTime;
    
    // Read temperatures from MLX90614
    ambientTemp = mlx.readAmbientTempC();
    objectTemp = mlx.readObjectTempC();
    
    // Print to Serial
    Serial.print("Ambient: ");
    Serial.print(ambientTemp);
    Serial.print("C | Object: ");
    Serial.print(objectTemp);
    Serial.println("C");
  }
  
  // Update OLED display
  updateDisplay();
  
  delay(50);
}

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(20, 0);
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
  display.print("MLX90614 | Status: OK");
  
  display.display();
}
