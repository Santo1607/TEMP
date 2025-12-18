# ESP32 MLX90614 + OLED Temperature Display

This project uses an ESP32 microcontroller to read infrared temperature data from an MLX90614 sensor and display it on an OLED screen.

## Hardware Requirements

- **ESP32 Development Board**
- **MLX90614 Infrared Thermometer** (I2C interface)
- **SSD1306 OLED Display** 128x64 pixels (I2C interface)
- **Jumper wires**
- **Power supply** (5V USB or battery)

## Wiring Diagram

### ESP32 Pinout
```
ESP32 Pin 21 (SDA) -------- MLX90614 SDA / OLED SDA
ESP32 Pin 22 (SCL) -------- MLX90614 SCL / OLED SCL
ESP32 GND ----------- MLX90614 GND / OLED GND
ESP32 3.3V/5V ------- MLX90614 VCC / OLED VCC
```

### I2C Default Addresses
- MLX90614: 0x5A (default)
- SSD1306 OLED: 0x3C (common)

Note: If using different I2C addresses, update the code accordingly.

## Library Installation

Install these libraries in Arduino IDE:

1. **Adafruit MLX90614 Library**
   - Search for "Adafruit MLX90614" in Library Manager
   - Install version 2.1.0 or later

2. **Adafruit SSD1306 Library**
   - Search for "Adafruit SSD1306" in Library Manager
   - Install version 2.5.0 or later

3. **Adafruit GFX Library** (dependency)
   - Search for "Adafruit GFX" in Library Manager
   - Install version 1.11.0 or later

## Arduino IDE Setup

1. Install ESP32 board support:
   - File → Preferences
   - Add to "Additional Boards Manager URLs":
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board Manager → Search "esp32" → Install

2. Select your board:
   - Tools → Board → ESP32 → Select your ESP32 variant (e.g., "ESP32 Dev Module")
   - Tools → Port → Select the COM port

## Features

- **Real-time temperature display** on OLED
- **Dual temperature readings**: Ambient and Object temperatures
- **Serial output** for debugging
- **Clean UI** with labeled temperature readings
- **Update interval**: 500ms (configurable)
- **Error handling** for sensor/display initialization

## Temperature Ranges

- **MLX90614**: -40°C to +125°C (object), -40°C to +85°C (ambient)
- **Accuracy**: ±0.5°C typical
- **Field of View**: ~90° (60° for wide-angle lens)

## Configuration

Edit these constants in the sketch to customize:

```cpp
#define SCREEN_WIDTH 128        // OLED width in pixels
#define SCREEN_HEIGHT 64        // OLED height in pixels
#define SCREEN_ADDRESS 0x3C     // OLED I2C address
#define SDA_PIN 21              // ESP32 SDA pin
#define SCL_PIN 22              // ESP32 SCL pin
#define UPDATE_INTERVAL 500     // Sensor read interval (ms)
```

## Debugging

- Open **Serial Monitor** (Ctrl+Shift+M) at **115200 baud**
- Temperature readings print every 500ms
- Check for initialization errors in the serial output

## Power Considerations

- **ESP32 current draw**: ~50mA (active)
- **MLX90614 current draw**: ~11mA
- **SSD1306 OLED current draw**: ~10mA
- **Total**: ~70mA typical

Use appropriate power supply (USB for development, 5V battery for portable use).

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "MLX90614 not found" | Check I2C connections, verify address (0x5A) |
| "SSD1306 allocation failed" | Verify OLED address (0x3C), check wiring |
| No display update | Check SCL/SDA pins are correct, inspect I2C bus |
| Erratic readings | Ensure proper shielding, keep sensor stable |

## Example Output

```
Ambient: 24.5C | Object: 32.1C
Ambient: 24.6C | Object: 32.2C
Ambient: 24.5C | Object: 32.0C
```

Display shows:
```
      Temperature Monitor
Amb: 24.5C
Obj: 32.1C
```
