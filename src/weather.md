---
theme: ["air", "alt"]
---

<!--Set a predefined theme to an individual page 
"air" is the default light mode theme but 'alt' swaps
the page and card background colors.-->

<!-- CSS Style -->
<link rel="stylesheet" href="./dashboard_styles.css"></link>

# Local Weather Forecast Project

```js
// Import D3
import * as d3 from "npm:d3";
```

```js
const locations = ["Lee's Summit", "New York", "St. Louis", "San Francisco", "Cupertino"];
const geoSelect = Inputs.select(locations, {value: "Lee's Summit", label: "City"});
// view function returns its associated DOM element.
// So it can access the value a user requests
const selectedVal = view(geoSelect);
```


```js
// Load original dataset
let forecast;

if (selectedVal == "Lee's Summit") {
    forecast = FileAttachment("./data/forecastlees.json").json();
} else if (selectedVal == "New York") {
    forecast = FileAttachment("./data/forecastnewyork.json").json();
    console.log(forecast)
} else if (selectedVal == "St. Louis") {
    forecast = FileAttachment("./data/forecaststlouis.json").json();
} else if (selectedVal == "San Francisco") {
    forecast = FileAttachment("./data/forecastsanfran.json").json();
} else {
    forecast = FileAttachment("./data/forecastcupertino.json").json();
}
```

```js
const lons = [];
const lats = [];
forecast.geometry.coordinates[0].forEach(loc => lons.push(loc[0]));
forecast.geometry.coordinates[0].forEach(loc => lats.push(loc[1]));
// Create the centroid of each city
// '...' is the spread operator: it spreads the array into individual arguments
// e.g., lats = [34.5, 42.1, 39.0]; then Math.min(...lats) -> Math.min(34.5, 42.1, 39.0)
const leafletLatLon = [
    Math.min(...lats) + (Math.max(...lats) - Math.min(...lats))/2,
    Math.min(...lons) + (Math.max(...lons) - Math.min(...lons))/2
];

```

```js
// Function to find the mode of categorical variables
function findMostFrequentDirection(directions) {
    // Extract unique words using Set object
    const uniqueDirects = new Set(directions);

    // Sort words
    directions.sort()

    let highestCount = 0;
    let mostFrequent = [];

    uniqueDirects.forEach(direct => {
        // Count direction
        const start = directions.indexOf(direct);
        const end = directions.lastIndexOf(direct);
        const count = end - start + 1;

        // Update highest count and most frequent direction
        if (count > highestCount) {
            highestCount = count;
            mostFrequent = [direct];
        }
        // Add word to most frequent list if it has
        // the same count as the current highest
        if (count == highestCount && !mostFrequent.includes(direct)) {
            mostFrequent.push(direct);
        }
    });

    return mostFrequent;
}
```

```js
// Define each column list of data we are looking at
const temperatures = [];
const precipitations = [];
const windSpeeds = [];
const windDirects = [];
const finDat = [];

// RegEx Patter to extract wind speed
const numPattern = /\d+/;
const numSearch = string => {let retVal = string.match(numPattern); return Number(retVal[0])};

// Original datasets
const candidates = forecast.properties.periods;

// Create label dictionaries
const labelDicts = {
    "time": "Time",
    "temperature": "Hourly Temperature (&deg;F)",
    "probPrec": "Precipitation (%)",
    "windSpeed": "Wind Speed (mph)",
    "windDirect": "Wind Direction",
    "isDaytime": "Daytime (1: Yes, 0: No)",
    "dewPoint": "Dew Point (&deg;C)",
    "relativeHumidity": "Relative Humidity (%)",
};

// Extract necessary data variables
candidates.forEach(obj => {temperatures.push(obj.temperature)});
candidates.forEach(obj => {precipitations.push(obj.probabilityOfPrecipitation.value)});
candidates.forEach(obj => {windSpeeds.push(numSearch(obj.windSpeed))});
candidates.forEach(obj => {windDirects.push(obj.windDirection)});

// Finalized reshaped dataset
for (let i = 0;i < forecast.properties.periods.length;i++) {
    finDat.push(
        {
            "time": candidates[i].startTime,
            "temperature": temperatures[i],
            "probPrec": precipitations[i],
            "windSpeed": windSpeeds[i],
            "windDirect": windDirects[i],
            "isDaytime": candidates[i].isDaytime==true?1:0,
            "dewPoint": candidates[i].dewpoint.value,
            "relativeHumidity": candidates[i].relativeHumidity.value,
        }
    );
}

// Calculate, average precipitation, wind speed, most frequent wind direction
const arrAvg = arr => {return arr.reduce((a, b) => a + b, 0) / arr.length};
let avgPrecp = arrAvg(precipitations);
let avgWindSpeed = arrAvg(windSpeeds);
let roundFormat = d3.format(".1f");
let modeDirect = findMostFrequentDirection(windDirects);

// Date parser and accessor
const dateParser = d3.timeParse("%Y-%m-%dT%H:%M:%S%Z")
const xAccessor = d => dateParser(d["startTime"])

// Display some of data
// display(xAccessor(forecast.properties.periods[0]));
// display(candidates[0]);
```

```js
// Load leaflet library for geospatial analysis
import * as L from "npm:leaflet";

// Add the geographical location of data
const div = display(document.createElement("div"));
div.style = "height: 400px; border-radius: 8px;";

// Map
const map = L.map(div)
    .setView(leafletLatLon, 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'})
    .addTo(map)
// Polygons
const targetArea = [];
forecast.geometry.coordinates[0].forEach(element => {
    targetArea.push([element[1], element[0]])
    }
)
L.polygon(targetArea).addTo(map)
```

<div class="grid grid-cols-3">
    <div class="card">
        <h2>Temperature Range</h2>
        <span class="big">
        ${Math.min(...temperatures)}&deg;F - ${Math.max(...temperatures)}&deg;F
        </span>
    </div>
    <div class="card">
        <h2>Average Precipitation</h2>
        <span class="big">${roundFormat(avgPrecp)} %</span>
    </div>
    <div class="card">
        <h2>Average Wind Speed</h2>
        <span class="big">${modeDirect.join('/')} ${roundFormat(avgWindSpeed)} mph</span>
    </div>
</div>

<div 
class="grid grid-cols-1";
style="grid-auto-rows: 600px; position: relative";
id="wrapper00";>
    <div class="card"; id="card00">
        <div id="tooltip00"; class="tooltip">
            <div class="tooltip-date";>
                <span id="date";></span>
            </div>
            <div class="tooltip-temperature";>
                Maximum Temperature: <span id="temperature";></span>
            </div>
        </div>
    </div>
</div>


```js
import { drawLineChart } from "./components/line_chart.js"
const chartContainer = d3.select("#card00");
chartContainer.selectAll("*").remove();
const tempLine = resize(
    (width, height) => drawLineChart(
        finDat, 
        "temperature", 
        "time", 
        width,
        height
    )
)
d3.select("#card00").node().appendChild(tempLine)
```

<div class="grid grid-cols-2"; id="wrapper01"; style="position: relative;">
    <div class="card grid-rowspan-2"; id="card10";>
        <div id="tooltip10"; class="tooltip";>
            <div class="tooltip-scatTime";>
                <span id="scatTime";></span>
            </div>
            <div class="tooltip-scatYmetric";>
                Y: <span id="scatYmetric";></span>
            </div>
            <div class="tooltip-scatXmetric";>
                X: <span id="scatXmetric";></span>
            </div>
            <div class="tooltip-scatCmetric";>
                Color: <span id="scatCmetric";></span>
            </div>
        </div>
    </div>
    <div class="card"; id="card100";>
        <div id="tooltip100"; class="tooltip";>
            <div class="tooltip-range";>
                X: <span id="range";></span>
            </div>
            <div class="tooltip-value";>
                Count: <span id="count";></span> hours
            </div>
        </div>
    </div>
    <div class="card"; id="card110";>
        <div id="tooltip110"; class="tooltip";>
             <div class="tooltip-range";>
                X: <span id="range";></span>
            </div>
            <div class="tooltip-value";>
                Count: <span id="count";></span> hours
            </div>
        </div>
    </div>
</div>

```js
import { drawScatter } from "./components/scatter_chart.js"
const scatter = resize(
   width => drawScatter(
    finDat, 
    "temperature", 
    "relativeHumidity", 
    "isDaytime", 
    width,
    labelDicts,
    "#tooltip10"
    )
)
d3.select('#card10').node().appendChild(scatter)
```

```js
import { drawBars100 } from "./components/bar_chart_100.js"
const histbar00 = resize(
    width => drawBars100(
        finDat,
        "temperature",
        width,
        labelDicts,
        "#tooltip100",
    )
)
d3.select("#card100").node().appendChild(histbar00)
```

```js
import { drawBars110 } from "./components/bar_chart_110.js"
const histbar10 = resize(
    width => drawBars110(
        finDat,
        "relativeHumidity",
        width,
        labelDicts,
        "#tooltip110",
    )
)
d3.select("#card110").node().appendChild(histbar10)

```

```js
let removePrevious = d3.select(geoSelect).on('change', event => {
    d3.select('#card00').node().removeChild(tempLine)
    d3.select('#card10').node().removeChild(scatter)
    d3.select("#card100").node().removeChild(histbar00)
    d3.select("#card110").node().removeChild(histbar10)
})
```

