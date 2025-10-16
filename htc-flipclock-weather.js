// Check if <wired-card> is already defined before importing its library
if (!customElements.get("wired-card")) {
    import("./vendor/wired-card-v0.8.1.js");
}

// Check if <wired-toggle> is already defined before importing its library
if (!customElements.get("wired-toggle")) {
    import("./vendor/wired-toggle-v0.8.0.js");
}
import {
    LitElement,
    html,
    css
} from "./vendor/lit-element-v2.0.1.js";
var old_time = {}
var intervalSetNewTime = ''
import { regional } from './regional.js?v1.1.5';
import { themes } from './themes.js?v1.0.2';
var forecastFinished = false;
var forecasts = {};
const weatherDefaults = {
    widgetPath: '/local/custom_ui/htc-clock-card/',
    lang: 'en',
    am_pm: false,
    svrOffset: 0,
    render: true,
    renderClock: true,
    renderDetails: true,
    high_low_entity: false,
    theme: {
        name: 'default',
        weather_icon_set: 'default'
    }
};
weatherDefaults['imagesPath'] = weatherDefaults.widgetPath + 'themes/' + weatherDefaults.theme['name'] + '/'
weatherDefaults['clockImagesPath'] = weatherDefaults.imagesPath + 'clock/'
weatherDefaults['weatherImagesPath'] = weatherDefaults.imagesPath + 'weather/' + weatherDefaults.theme['weather_icon_set'] + '/'

const htcVersion = "1.5.0";


const weatherIconsDay = {
    clear: "sunny",
    "clear-night": "night",
    cloudy: "cloudy",
    fog: "fog",
    hail: "hail",
    lightning: "thunder",
    "lightning-rainy": "thunder",
    partlycloudy: "partlycloudy",
    pouring: "pouring",
    rainy: "pouring",
    snowy: "snowy",
    "snowy-rainy": "snowy-rainy",
    sunny: "sunny",
    windy: "cloudy",
    "windy-variant": "cloudy-day-3",
    exceptional: "na"
};

const weatherIconsNight = {
    ...weatherIconsDay,
    fog: "fog",
    clear: "night",
    sunny: "night",
    partlycloudy: "cloudy-night-3",
    "windy-variant": "cloudy-night-3"
};



const fireEvent = (node, type, detail, options) => {
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new Event(type, {
        bubbles: options.bubbles === undefined ? true : options.bubbles,
        cancelable: Boolean(options.cancelable),
        composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
};

function hasConfigOrEntityChanged(element, changedProps) {
    if (changedProps.has("_config")) {
        return true;
    }
    const oldHass = changedProps.get("hass");
    if (oldHass) {
        return (
            oldHass.states[element._config.entity] !==
            element.hass.states[element._config.entity] ||
            oldHass.states["sun.sun"] !== element.hass.states["sun.sun"] ||
            oldHass.states["sensor.date_time_iso"] !== element.hass.states["sensor.date_time_iso"]
        );
    }
    return true;
}
console.info("%c HTC Flip Clock %c ".concat(htcVersion, " "), "color: white; background: #555555; ", "color: white; background: #3a7ec6; ");
class HtcWeather extends LitElement {
    numberElements = 0
    static get getConfig() {
        return this._config;
    }
    static set setConfig(config) {
        this._config = config;
    }
    static get getHass() {
        return this.hass;
    }
    static set setHass(hass) {
        this.hass = hass;
    }
    static get properties() {
        return {
            _config: this.getConfig,
            hass: this.getHass
        };
    }

    async importJquery() {
        await import("./lib/jquery-3.4.1.min.js")
        return { config: this._config, entity: this.hass.states[this._config.entity], hass_states: this.hass.states }
    }

    static getStubConfig() {
        return {};
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error(`Entity not available/installed: ${config.entity}`);
        }
        var defaultConfig = {}
        for (const property in config) {
            defaultConfig[property] = config[property]
            if (property == 'lang') {
                if (!regional[config[property]]) {
                    defaultConfig[property] = weatherDefaults[property]
                }
            }

        }
        for (const property in weatherDefaults) {
            if (config[property] === undefined) {
                defaultConfig[property] = weatherDefaults[property]
            }
        }
        defaultConfig['imagesPath'] = defaultConfig.widgetPath + 'themes/' + defaultConfig.theme['name'] + '/'
        defaultConfig['clockImagesPath'] = defaultConfig.imagesPath + 'clock/'
        defaultConfig['weatherImagesPath'] = defaultConfig.imagesPath + 'weather/' + defaultConfig.theme['weather_icon_set'] + '/'
        this._config = defaultConfig;
    }
    shouldUpdate(changedProps) {
        var shouldUpdate = hasConfigOrEntityChanged(this, changedProps);
        if (shouldUpdate) {
            HtcWeather.setHass = this.hass
        }
        if (!forecastFinished) {
            this.updateForecasts()
        }
        return shouldUpdate;
    }
    updateForecasts() {
        if (!this._config || !this.hass) {
            return;
        }
        const self = this;
        HtcWeather.setConfig = this._config
        HtcWeather.setHass = this.hass
        var entity = this._config.entity;
        var entity_name = this._config.entity;
        if (this._config.high_low_entity) {
            if (!this.hass.states[this._config.high_low_entity.entity_id]) {
                entity = this.hass.states[this._config.high_low_entity.entity_id]
                entity_name = this._config.high_low_entity.entity_id;
            }
        }
        if (!this._config.high_low_entity) {
            HtcWeather.getHass.callService('weather', 'get_forecasts', { 'type': 'daily' }, { 'entity_id': self._config.entity }, false, true).then(function (res) {
                forecastFinished = true;
                forecasts = res.response[self._config.entity].forecast
            })
        }
        this.requestUpdate(); 
    }

    render() {
        if (!this._config || !this.hass) {
            return html``;
        }
    
        HtcWeather.setConfig = this._config;
        HtcWeather.setHass = this.hass;
    
        const responsiveStyle = html`
          <style>
            ha-card {
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding: 0;
              overflow: visible;
            }
    
            .htc-scale-wrapper {
              width: fit-content;
              height: fit-content;
            }
    
            .htc-center-wrapper {
              display: inline-block;
              transform: scale(0.85);
              transform-origin: top center;
            }
    
            @media (max-width: 480px) {
              .htc-center-wrapper {
                transform: scale(0.85);
              }
            }
    
            #htc-weather-card-container {
              width: 480px;
              height: auto;
              position: relative;
              overflow: visible;
              transform-origin: top left;
              margin: 0 auto;
            }
    
            #htc-clock, #htc-weather {
              max-width: 100%;
              height: auto;
              display: block;
              transform-origin: top left;
            }
    
            /* ✅ Clock as positioning context */
            #htc-clock {
              position: relative;
              overflow: visible;
            }
    
            #hours, #minutes {
              position: relative;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
            }
    
            img#hours_bg, img#minutes_bg {
              position: absolute;
              top: 0;
              left: 0;
              transform: translate(10%, 0%);
              width: 100%;
              height: 100%;
            }
    
            #hours .line, #minutes .line {
              position: absolute;
              transform: translate(12%, 0%);
            }
    
            .first_digit, .second_digit {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(20%, 0%);
            }
    
            /* Weather container */
            #htc-weather {
              position: relative;
              display: inline-block;
              transform: translateX(5%) scale(0.9);
              max-width: 100%;
              box-sizing: border-box;
            }
    
            .temp-value {
              font-size: 0.8em;
              display: inline-flex;
              align-items: baseline;
              white-space: nowrap;
            }
    
            .sunrise, .sunset {
              display: block;
              font-size: 0.7em;
            }
    
            /* ✅ Proper positioning of bottom info inside clock */
            #bottom {
              position: absolute;
              top: 43%;           /* adjust this value to move up or down */
              right: 0%;
              transform: translateY(-50%);  /* vertically center around that point */
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              text-align: right;
              gap: 0px;
              line-height: 0.7em;
            }
    
            #sun_details, #wind_details {
              display: block;
              font-size: 0.7em;
              text-align: right;
              line-height: 0.5em !important; 
              margin-top: -5px !important; 
              padding-top: -5px !important;
            }
    
          </style>
        `;
    
        return html`
          ${responsiveStyle}
          <ha-card @click="${this._handleClick}">
            <div class="htc-scale-wrapper">
              <div class="htc-center-wrapper">
                ${this.renderCardContent()}
              </div>
            </div>
          </ha-card>
        `;
    }
    
    renderCardContent() {
        if (!this.hass) return html``;
    
        const container = document.createElement('div');
        const root = container;
    
        const style = document.createElement('style');
        style.textContent = this.getStyle(this._config);
        root.appendChild(style);
    
        let container_size = this._config.renderForecast ? '470px' : '320px';
        let scaleFactor = window.innerWidth <= 480 ? 0.9 : 0.9;
    
        const cardContainer = document.createElement('div');
        cardContainer.id = 'htc-weather-card-container';
        cardContainer.style = `
            height: calc(${container_size} * ${scaleFactor});
            width: 480px;
            max-width: 100%;
            position: relative;
            overflow: visible;
        `;
        root.appendChild(cardContainer);
    
        const old_time = HtcWeather.getOldTime();
    
        const htc_clock = document.createElement('div');
        htc_clock.id = 'htc-clock';
        htc_clock.classList.add(`htc-clock-${this.numberElements}`);
        cardContainer.appendChild(htc_clock);
    
        // Hours
        const htc_clock_hours = document.createElement('div');
        htc_clock_hours.id = 'hours';
        htc_clock.appendChild(htc_clock_hours);
    
        const htc_clock_hours_line = document.createElement('div');
        htc_clock_hours_line.classList.add('line');
        htc_clock_hours.appendChild(htc_clock_hours_line);
    
        const hours_bg_img = document.createElement('img');
        hours_bg_img.id = 'hours_bg';
        hours_bg_img.src = `${this._config.clockImagesPath + 'clockbg1.png'}`;
        htc_clock_hours.appendChild(hours_bg_img);
    
        const hours_bg_first = document.createElement('img');
        hours_bg_first.id = 'fhd';
        hours_bg_first.src = `${this._config.clockImagesPath + old_time.firstHourDigit + '.png'}`;
        hours_bg_first.classList.add('first_digit');
        htc_clock_hours.appendChild(hours_bg_first);
    
        const hours_bg_second = document.createElement('img');
        hours_bg_second.id = 'shd';
        hours_bg_second.src = `${this._config.clockImagesPath + old_time.secondHourDigit + '.png'}`;
        hours_bg_second.classList.add('second_digit');
        htc_clock_hours.appendChild(hours_bg_second);
    
        // Minutes
        const htc_clock_minutes = document.createElement('div');
        htc_clock_minutes.id = 'minutes';
        htc_clock.appendChild(htc_clock_minutes);
    
        const hours_min_img = document.createElement('img');
        hours_min_img.id = 'minutes_bg';
        hours_min_img.src = `${this._config.clockImagesPath + 'clockbg1.png'}`;
        htc_clock_minutes.appendChild(hours_min_img);
    
        const htc_clock_minutes_line = document.createElement('div');
        htc_clock_minutes_line.classList.add('line');
        htc_clock_minutes.appendChild(htc_clock_minutes_line);
    
        if (this._config.am_pm !== false) {
            const htc_clock_am_pm = document.createElement('div');
            htc_clock_am_pm.id = 'am_pm';
            htc_clock.appendChild(htc_clock_am_pm);
    
            const am_pm_img = document.createElement('img');
            am_pm_img.src = `${this._config.clockImagesPath + 'am.png'}`;
            htc_clock_am_pm.appendChild(am_pm_img);
        }
    
        const min_bg_first = document.createElement('img');
        min_bg_first.id = 'fmd';
        min_bg_first.src = `${this._config.clockImagesPath + old_time.firstMinuteDigit + '.png'}`;
        min_bg_first.classList.add('first_digit');
        htc_clock_minutes.appendChild(min_bg_first);
    
        const min_bg_second = document.createElement('img');
        min_bg_second.id = 'smd';
        min_bg_second.src = `${this._config.clockImagesPath + old_time.secondMinuteDigit + '.png'}`;
        min_bg_second.classList.add('second_digit');
        htc_clock_minutes.appendChild(min_bg_second);
    
        // ✅ Bottom-right info overlay INSIDE clock
        const bottomContainer = document.createElement('div');
        bottomContainer.id = 'bottom';
        htc_clock.appendChild(bottomContainer);
    
        if (this._config.showSunData !== false) {
            const sunDetails = document.createElement('div');
            sunDetails.id = 'sun_details';
            sunDetails.innerHTML = `
              <div>Sunrise: ${this._config.sunrise}</div>
              <div>Sunset: ${this._config.sunset}</div>
            `;
            bottomContainer.appendChild(sunDetails);
        }
    
        if (this._config.showWindData !== false) {
            const windDetails = document.createElement('div');
            windDetails.id = 'wind_details';
            windDetails.textContent = `Wind: ${this._config.windSpeed}`;
            bottomContainer.appendChild(windDetails);
        }
    
        // Weather container
        const htc_weather = document.createElement('div');
        htc_weather.id = 'htc-weather';
        htc_weather.classList.add(`htc-weather-${this.numberElements}`);
        cardContainer.appendChild(htc_weather);
    
        const tempContainer = document.createElement('span');
        tempContainer.classList.add('temp-value');
        tempContainer.textContent = `${this._config.temp}°C`;
        htc_weather.appendChild(tempContainer);
    
        const spinner = document.createElement('p');
        spinner.classList.add('loading');
        spinner.innerHTML = `Fetching weather...`;
        htc_weather.appendChild(spinner);
    
        if (!window.jQuery) {
            this.importJquery().then(function () {
                HtcWeather.setNewTime(htc_clock);
                HtcWeather.setNewWeather(htc_weather);
            });
        } else {
            HtcWeather.setNewTime(htc_clock);
            HtcWeather.setNewWeather(htc_weather);
        }
    
        return container;
    }


    static setNewWeather(elem) {
        var config = HtcWeather.getConfig;
        var stateObj = HtcWeather.getHass.states[HtcWeather.getConfig.entity];
        var hass_states = HtcWeather.getHass.states;
        var temp_now = Math.round(stateObj.attributes.temperature * 100) / 100
        var weatherIcon = HtcWeather.getWeatherIcon(config, stateObj.state)
        var curr_temp = `<p class="temp">${String(temp_now)}
                         <span class="metric">
                         ${HtcWeather.getUnit("temperature")}</span></p>`;
        $(elem).css('background', 'url('
            + weatherIcon
            + ') 50% 0 no-repeat');
        var weather = `<div id="local">
                                 <p class="city">${stateObj.attributes.friendly_name}</p>
                                 ${curr_temp}
                             </div>`;
        weather += HtcWeather.getHighLow();

        weather += '</p></div>';
        
        $(elem).html(weather);
        if (config.renderForecast) {
            var ulElement = `<ul id="forecast"></ul>`;
            $(elem).append(ulElement);

            for (var i = 0; i <= 3; i++) {
                if(!forecasts[i]) continue;
                var d_date = new Date(forecasts[i].datetime);
                var forecastIcon = HtcWeather.getWeatherIcon(config, forecasts[i].condition, hass_states)
                var forecast = `<li>`;
                forecast += `<p class="dayname">${regional[config.lang]['dayNames'][d_date.getDay()]}&nbsp;${d_date.getDate()}</p>
                                      <img src="${forecastIcon}" alt="${forecasts[i].condition}" title="${forecasts[i].condition}" />
                                      <div class="daytemp">${Math.round(forecasts[i].temperature * 100) / 100}${this.getUnit("temperature")}`
                if (forecasts[i].templow) {
                    forecast += `&nbsp;/&nbsp;${Math.round(forecasts[i].templow * 100) / 100}${this.getUnit("temperature")}`;
                }
                forecast += `</div></li>`;
                $(elem).find('#forecast').append(forecast);
            }
        }
        if (config.renderDetails) {
            HtcWeather.renderDetails(elem, config, stateObj, hass_states)
        }
    }

    static getHighLow() {
        var config = HtcWeather.getConfig
        var returnEntityHtml = '';
        var high_low_state = '';
        var today_date = `${regional[config.lang]['dayNames'][new Date().getDay()]}&nbsp;${new Date().getDate()}`;
        var is_forecast = true;
        if (config.high_low_entity) {
            var stateObj = HtcWeather.getHass.states[config.high_low_entity.entity_id]
            high_low_state = stateObj.state
            var high_low_date = (config.high_low_entity.name) ? config.high_low_entity.name : today_date;
            is_forecast = false
        } else {
            var stateObj = HtcWeather.getHass.states[config.entity]
            if(forecasts && forecasts[0]){
                 high_low_state = Math.round(forecasts[0].temperature * 100) / 100 + '&deg'
            }
            var high_low_date = today_date;
        }
        returnEntityHtml += `<div id="temp"><p id="date">&nbsp${high_low_date}</p>
                             ${high_low_state}`
        if (is_forecast && forecasts && forecasts[0] && forecasts[0].templow) {
            returnEntityHtml += `&nbsp;/&nbsp;${Math.round(forecasts[0].templow * 100) / 100}&deg;`;
        }
        return returnEntityHtml;
    }
    static getOldTime() {
        var config = HtcWeather.getConfig
        var localtime = new Date(HtcWeather.getHass.states["sensor.date_time_iso"].state);
        var now = new Date(localtime.getTime() - (config.svrOffset * 1000));
        var old = new Date();
        old.setTime(now.getTime() - 60000);

        var old_hours, old_minutes;
        old_hours = old.getHours();
        old_minutes = old.getMinutes();

        if (config.am_pm) {
            old_hours = ((old_hours > 12) ? old_hours - 12 : old_hours);
        }

        old_hours = ((old_hours < 10) ? "0" : "") + old_hours;
        old_minutes = ((old_minutes < 10) ? "0" : "") + old_minutes;

        return {
            firstHourDigit: old_hours.substr(0, 1),
            secondHourDigit: old_hours.substr(1, 1),
            firstMinuteDigit: old_minutes.substr(0, 1),
            secondMinuteDigit: old_minutes.substr(1, 1),
            old_hours: old_hours,
            old_minutes: old_minutes
        }
    }
    static setNewTime(elem) {
        var config = HtcWeather.getConfig
        var localtime = new Date(HtcWeather.getHass.states["sensor.date_time_iso"].state);
        var now = new Date(localtime.getTime() - (config.svrOffset * 1000));
        
        var now_hours, now_minutes;
        now_hours = now.getHours();
        now_minutes = now.getMinutes();
        
        if (config.am_pm) {
            var am_pm = now_hours > 11 ? 'pm' : 'am';
            $(elem).find("#am_pm").find('img').attr("src", config.clockImagesPath + am_pm + ".png")
            now_hours = ((now_hours > 12) ? now_hours - 12 : now_hours);
        }

        now_hours = ((now_hours < 10) ? "0" : "") + now_hours;
        now_minutes = ((now_minutes < 10) ? "0" : "") + now_minutes;
        
        var newFirstHourDigit = now_hours.substr(0, 1);
        var newSecondHourDigit = now_hours.substr(1, 1);
        var newFirstMinuteDigit = now_minutes.substr(0, 1);
        var newSecondMinuteDigit = now_minutes.substr(1, 1);

        $(elem).find("#fmd").attr('src', config.clockImagesPath + newFirstMinuteDigit + '.png');
        $(elem).find("#smd").attr('src', config.clockImagesPath + newSecondMinuteDigit + '.png');
        
        if (now_minutes == '00') {
            $(elem).find('#fhd').attr('src', config.clockImagesPath + newFirstHourDigit + '.png');
            $(elem).find('#shd').attr('src', config.clockImagesPath + newSecondHourDigit + '.png');
        }
    }
    static getUnit(measure) {
        const lengthUnit = HtcWeather.getHass.config.unit_system.length;
        switch (measure) {
            case "air_pressure":
                return lengthUnit === "km" ? "hPa" : "inHg";
            case "length":
                return lengthUnit;
            case "precipitation":
                return lengthUnit === "km" ? "mm" : "in";
            default:
                return HtcWeather.getHass.config.unit_system[measure] || "";
        }
    }

    static renderDetails(elem, config, stateObj, hass_states) {
        const sun = hass_states["sun.sun"];
        if (sun) {
            const next_rising = new Date(sun.attributes.next_rising);
            const next_setting = new Date(sun.attributes.next_setting);
            $(elem).append(`<div id="bottom">
                <div id="wind_details"></div>
                <div id="sun_details"></div>
            </div>`);
            var sun_details = `<font color="orange">☀</font> <font color="green"><ha-icon icon="mdi:weather-sunset-up"></ha-icon></font>&nbsp;${next_rising.toLocaleTimeString()}&nbsp;&nbsp;&nbsp;<font color="red"><ha-icon icon="mdi:weather-sunset-down"></ha-icon></font>&nbsp;${next_setting.toLocaleTimeString()}`;
            $(elem).find('#sun_details').append(sun_details);
            $(elem).find('#wind_details').append(`
                       <span class="ha-icon"><ha-icon icon="mdi:weather-windy"></ha-icon></span>
                       ${regional[config.lang]['windDirections'][parseInt((stateObj.attributes.wind_bearing + 11.25) / 22.5)]} ${stateObj.attributes.wind_speed} ${stateObj.attributes.wind_speed}<span class="unit">
                       ${this.getUnit("length")}/h</span>
                    `);
        }
    }

    static getWeatherIcon(config, condition) {
        var hass_states = HtcWeather.getHass.states
        return `${config.weatherImagesPath}${hass_states["sun.sun"] && hass_states["sun.sun"].state == "below_horizon"
            ? weatherIconsNight[condition]
            : weatherIconsDay[condition]
            }.png`;
    }

    _handleClick(entity) {
        fireEvent(this, "hass-more-info", { entityId: this._config.entity });
    }

    getCardSize() {
        return 3;
    }
    
    getStyle(config) {
        if (themes[config.theme['name']] && themes[config.theme['name']]['css']) {
            return themes[config.theme['name']]['css'];
        }
        return ''; 
    }
}

customElements.define("htc-weather-card", HtcWeather);
