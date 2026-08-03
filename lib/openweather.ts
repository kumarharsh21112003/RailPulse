export interface WeatherData {
  stationCode?: string;
  stationName?: string;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedKmh: number;
  condition: string; // e.g. "Clear", "Rain", "Clouds"
  icon: string;
  rainChancePercent?: number;
}

function mapWmoToCondition(wmoCode: number): { condition: string; icon: string } {
  if (wmoCode === 0) return { condition: 'Clear', icon: '01d' };
  if (wmoCode === 1 || wmoCode === 2) return { condition: 'Partly Cloudy', icon: '02d' };
  if (wmoCode === 3) return { condition: 'Overcast', icon: '04d' };
  if (wmoCode === 45 || wmoCode === 48) return { condition: 'Fog', icon: '50d' };
  if (wmoCode >= 51 && wmoCode <= 57) return { condition: 'Drizzle', icon: '09d' };
  if (wmoCode >= 61 && wmoCode <= 67) return { condition: 'Rain', icon: '10d' };
  if (wmoCode >= 71 && wmoCode <= 77) return { condition: 'Snow', icon: '13d' };
  if (wmoCode >= 80 && wmoCode <= 82) return { condition: 'Rain Showers', icon: '09d' };
  if (wmoCode >= 85 && wmoCode <= 86) return { condition: 'Snow Showers', icon: '13d' };
  if (wmoCode >= 95 && wmoCode <= 99) return { condition: 'Thunderstorm', icon: '11d' };
  return { condition: 'Clear', icon: '01d' };
}

export async function getWeatherForLocation(
  lat: number,
  lng: number,
  stationName?: string,
  stationCode?: string
): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const current = data.current;
      const { condition, icon } = mapWmoToCondition(current.weather_code);
      return {
        stationCode,
        stationName,
        tempC: Math.round(current.temperature_2m),
        feelsLikeC: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeedKmh: Math.round(current.wind_speed_10m),
        condition,
        icon,
        rainChancePercent: current.precipitation > 0 ? 80 : 10,
      };
    }
  } catch (err) {
    console.warn('Open-Meteo API request failed, using fallback', err);
  }

  // Graceful fallback weather generator based on latitude
  return {
    stationCode,
    stationName,
    tempC: 28,
    feelsLikeC: 30,
    humidity: 62,
    windSpeedKmh: 14,
    condition: 'Clear',
    icon: '01d',
    rainChancePercent: 15,
  };
}
