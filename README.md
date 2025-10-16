# HomeAssistant HTC Flipclock with Weather card
[![](https://img.shields.io/github/release/FGOD1983/htc-clock-card.svg?style=flat-square)](https://github.com/FGOD1983/htc-clock-card/releases/latest)

HTC Flip clock with weather for [Home Assistant](https://github.com/home-assistant/home-assistant)

<img width="476" height="306" alt="image" src="https://github.com/user-attachments/assets/7deef0c4-b6d5-4dd3-b674-636180d2a957" />

# Support
Hey if you like what I did with this, :beers: or a :pizza: would be nice :D

[![coffee](https://www.buymeacoffee.com/assets/img/custom_images/black_img.png)](https://buymeacoffee.com/fgod)

## Notes
This custom Lovelace card displays a clock and weather information inspired by the classic HTC home screen. This version is maintained and fixed by me with some AI help. The [original version](https://github.com/iamBiB/lovelace-htc-flipclock-weather) was created by Bogdan (@iamBiB) credits on the great work go to Bogdan for creating it in the first place. I have no intention at the moment to maintain this as I am not that good with JS, but if somebody wants to help with getting functionality back such as the forecast or the flip animation, code merges are more than welcome!

## 🛠️ Installation and Setup: HTC Clock Card

### ☁️ Step 1: Install Prerequisites (Terminal Access)
You must have the Terminal & SSH Add-on (or similar console access) installed and working to perform the manual Git clone. You will also need the File editor or Studio Code Server Add-on for configuring the sensors.

### 💾 Step 2: Manual Card Installation via Git Clone
We will clone the repository directly into a custom directory in your Home Assistant's www folder.

#### 2.1. Create the Directory Structure
Open the Terminal Add-on. Create the custom directory structure:
```bash
mkdir -p /config/www/custom_ui
```
Navigate into the new directory:
```bash
cd /config/www/custom_ui
```

#### 2.2. Clone the Repository
While inside the /config/www/custom_ui directory in your Terminal, clone this card's repository. This will create the required htc-clock-card folder.
```Bash
git clone https://github.com/FGOD1983/htc-clock-card
```

### 📝 Step 3: Configure Template Sensors (Required)
The card relies on several Home Assistant Template Sensors to display time and date information. You must add the following configuration to create these sensors.

#### Option 1: Add to configuration.yaml (Simple Setup)
Open the File editor Add-on and open configuration.yaml.

Add the following block to the end of the file. If a template: key already exists, merge the new content underneath it but without the `template:` key.

```yaml
template:
  # Required for HTC Clock Card
  - trigger:
      - platform: time_pattern
        minutes: "/1"  # update every minute
    sensor:
      - name: "Time"
        state: "{{ now().strftime('%H:%M') }}"
        unique_id: time_sensor
      - name: "Date"
        state: "{{ now().strftime('%A, %d %B %Y') }}"
        unique_id: date_sensor
      - name: "Date Time"
        state: "{{ now().strftime('%Y-%m-%d %H:%M:%S') }}"
        unique_id: date_time_sensor
      - name: "Date Time UTC"
        state: "{{ now().utcnow().strftime('%Y-%m-%d %H:%M:%S') }}"
        unique_id: date_time_utc_sensor
      - name: "Date Time ISO"
        state: "{{ now().isoformat() }}"
        unique_id: date_time_iso_sensor
      - name: "Time Date"
        state: "{{ now().strftime('%H:%M, %A %d %B %Y') }}"
        unique_id: time_date_sensor
      - name: "Time UTC"
        state: "{{ now().utcnow().strftime('%H:%M') }}"
        unique_id: time_utc_sensor
      - name: "Beat Time"
        state: >-
          {% set now_utc = now().utcnow() %}
          {% set seconds_since_midnight = now_utc.hour * 3600 + now_utc.minute * 60 + now_utc.second %}
          {% set beats = ((seconds_since_midnight + 3600) / 86.4) | int %}
          @{{ beats }}
        unique_id: beat_time_sensor
```

#### Option 2: Add to a Separate templates.yaml File (Versatile Setup)
If you prefer to keep your configuration clean using includes, open configuration.yaml and ensure you have the following line (if not already present):

```yaml
template: !include templates.yaml
```
Create a new file in your /config directory named templates.yaml and paste the sensor configuration without the top-level `template:` key (as seen below):

```yaml
- trigger:
    - platform: time_pattern
      minutes: "/1"  # update every minute
  sensor:
    - name: "Time"
      state: "{{ now().strftime('%H:%M') }}"
      unique_id: time_sensor
    - name: "Date"
      state: "{{ now().strftime('%A, %d %B %Y') }}"
      unique_id: date_sensor
    - name: "Date Time"
      state: "{{ now().strftime('%Y-%m-%d %H:%M:%S') }}"
      unique_id: date_time_sensor
    - name: "Date Time UTC"
      state: "{{ now().utcnow().strftime('%Y-%m-%d %H:%M:%S') }}"
      unique_id: date_time_utc_sensor
    - name: "Date Time ISO"
      state: "{{ now().isoformat() }}"
      unique_id: date_time_iso_sensor
    - name: "Time Date"
      state: "{{ now().strftime('%H:%M, %A %d %B %Y') }}"
      unique_id: time_date_sensor
    - name: "Time UTC"
      state: "{{ now().utcnow().strftime('%H:%M') }}"
      unique_id: time_utc_sensor
    - name: "Beat Time"
      state: >-
        {% set now_utc = now().utcnow() %}
        {% set seconds_since_midnight = now_utc.hour * 3600 + now_utc.minute * 60 + now_utc.second %}
        {% set beats = ((seconds_since_midnight + 3600) / 86.4) | int %}
        @{{ beats }}
      unique_id: beat_time_sensor
```
After this you can reload your template entities. Go to Developer Tools → YAML → YAML configuration and click the RELOAD button under Template entities.

### 🌐 Step 4: Add Lovelace Resource
This step tells Home Assistant where to load the card's JavaScript file from.

In Home Assistant, navigate to Settings → Dashboards.
Click the Resources tab (or the three-dot menu in the top right, then Manage Resources).
Click the Add Resource button.
Enter the exact path, which points to the file you cloned:
```
URL: /local/custom_ui/htc-clock-card/htc-flipclock-weather.js

Resource Type: Select JavaScript Module
```
Click Create.

### 🃏 Step 5: Add the Card to Your Dashboard
Navigate to your desired dashboard and click the three-dot menu → Edit Dashboard.

Click Add Card (+) and select the Manual Card option.

Paste the example configuration below, replacing weather.home with your actual weather entity ID (e.g., weather.openweathermap) and the date/time sensor with the one you like.
```yaml
type: custom:htc-weather-card
entity: weather.home
sun: sun.sun
high_low_entity:
  entity_id: sensor.date
  name: Extra info
```
Click Save.

Final Step: Clear your browser cache or perform a hard refresh (Ctrl+F5 or Cmd+Shift+R) to ensure the new card resources are loaded. The HTC Clock Card should now appear on your dashboard!

### Simple install
* Not yet available. In order to get this working there are still some hoops to go through, but feel free to fix those and we can always see if we can add it to HACS to make the install easier.

## 🔄 Updating the Card in the Future
To update the card and get the latest fixes and features from this repository, you must manually pull the changes using the Terminal Add-on.

Navigate to the card's directory, which contains the .git folder:
```bash
cd /config/www/custom_ui/htc-clock-card
```
Pull the latest changes from the GitHub repository:
```bash
git pull
```
The terminal will display output showing which files have been updated.

After the update is complete, clear your browser cache and/or perform a hard refresh (Ctrl+F5 or Cmd+Shift+R) on your Lovelace dashboard to ensure the new JavaScript file is loaded by your browser.

## Using the card

### Options

#### Card options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | **required** | `custom:htc-weather-card`
| entity | string | **required** | The entity_id from an entity within the `weather` domain.
| name | string | optional | Set a custom name.
| lang | string | optional | Set a language (ro/en/nl/cz available).
| am_pm | string | optional | Set clock in AM/PM format.
| svrOffset | int | optional | If you need offset on time (seconds).
| renderForecast | bool | optional | Render forecast (only 4 days).
| renderClock | bool | optional | Render clock.
| renderDetails | bool | optional | Render sunt details and wind.
| high_low_entity | bool | optional | Replace high / low temperature with a custom entity. Params available entity_id, name. Default high / low temperature today
| renderDetails | bool | optional | Render sunt details and wind.
| theme.name |  | optional | Change theme (default/dusk).
| theme.weather_icon_set |  | optional | Change theme icon set. For default you have `picto` alternative. For dusk you have `htc` alternative

## License
This project is under the MIT license.
