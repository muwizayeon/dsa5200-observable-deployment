const longitude = -122.42488630714723;
const latitude = 37.77486561049896;

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return await response.json();
}

const station = await json(
  `https://api.weather.gov/points/${latitude},${longitude}`,
);
const forecast = await json(station.properties.forecastHourly);

process.stdout.write(JSON.stringify(forecast));
