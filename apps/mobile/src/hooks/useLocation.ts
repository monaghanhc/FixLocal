import { Platform } from 'react-native';

type LocationResult = {
  coords: { latitude: number; longitude: number };
  address?: string;
};

export async function getCurrentLocationWithAddress(): Promise<LocationResult> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Use reverse geocode via free API
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await resp.json();
            const address = data.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            resolve({ coords: { latitude, longitude }, address });
          } catch {
            resolve({ coords: { latitude, longitude }, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          }
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  } else {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');
    const pos = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = pos.coords;
    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    const g = geocode[0];
    const address = g
      ? [g.streetNumber, g.street, g.city, g.region, g.postalCode].filter(Boolean).join(' ')
      : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    return { coords: { latitude, longitude }, address };
  }
}
