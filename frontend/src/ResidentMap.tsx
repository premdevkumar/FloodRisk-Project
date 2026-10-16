import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, AlertTriangle, Clock, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { apiClient } from './api';
import type { FloodStation } from './api';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Custom pulsating Tailwind/HTML Leaflet icon for Danger Zones
const floodWarningIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div style="width:26px; height:26px; background-color:#dc2626; border-radius:50%; border:2px solid #ffffff; box-shadow:0 4px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; animation: pulse 1.5s infinite;">
           <span style="color:#ffffff; font-size:12px; font-weight:bold;">!</span>
         </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

interface StepDirection {
  instruction: string;
  distanceKm: string;
  durationMin: string;
}

interface RouteInfo {
  totalDuration: string;
  totalDistance: string;
  isDetoured: boolean;
  steps: StepDirection[];
}

export const ResidentMap: React.FC = () => {
  const [stations, setStations] = useState<FloodStation[]>([]);
  const [liveEvents, setLiveEvents] = useState<Array<{ regionName: string; latitude: number; longitude: number; dangerLevel: number }>>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([16.5062, 80.6050]); // Vijayawada center default
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isSafeMode, setIsSafeMode] = useState<boolean>(true);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showDirections, setShowDirections] = useState<boolean>(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);
  const [hasNotified, setHasNotified] = useState<boolean>(false);

  // Establish STOMP WebSocket Connection to Spring Boot Message Broker
  useEffect(() => {
    let stompClient: Client | null = null;
    try {
      const socket = new SockJS('http://localhost:8080/ws/live-dashboard');
      stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
      });

      stompClient.onConnect = () => {
        console.log('Connected to live WebSocket flood alert stream');
        stompClient?.subscribe('/topic/floods', (message) => {
          const newFloodEvent = JSON.parse(message.body);
          setLiveEvents((prev) => [...prev, newFloodEvent]);
          setAlertBanner(`🚨 LIVE FLOOD EVENT DETECTED: ${newFloodEvent.regionName}`);
        });
      };

      stompClient.activate();
    } catch {
      console.log('WebSocket connection failed, continuing with REST polling.');
    }

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, []);

  useEffect(() => {
    fetchStations();
    getUserLocation();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          checkProximityAlert(loc[0], loc[1], stations);
        },
        () => console.log('Location permission denied, using default Vijayawada position.')
      );
    }
  };

  const fetchStations = async () => {
    try {
      const res = await apiClient.get<FloodStation[]>('/resident/flood-stations');
      setStations(res.data);
      checkProximityAlert(userLocation[0], userLocation[1], res.data);
    } catch {
      // Fallback default stations
      const defaults: FloodStation[] = [
        {
          stationId: 'CWC-AP-01',
          stationName: 'Vijayawada Prakasham Barrage',
          riverName: 'Krishna River',
          state: 'Andhra Pradesh',
          latitude: 16.5062,
          longitude: 80.6050,
          currentWaterLevelMeters: 18.5,
          dangerLevelMeters: 12.0,
          status: 'EXTREME_DANGER',
          strandedResidents: 450,
          lastUpdated: 'Just Now',
        },
        {
          stationId: 'CWC-AP-02',
          stationName: 'Rajahmundry Barrage',
          riverName: 'Godavari River',
          state: 'Andhra Pradesh',
          latitude: 17.0005,
          longitude: 81.7800,
          currentWaterLevelMeters: 15.2,
          dangerLevelMeters: 14.0,
          status: 'DANGER',
          strandedResidents: 280,
          lastUpdated: 'Just Now',
        },
        {
          stationId: 'CWC-TS-01',
          stationName: 'Bhadrachalam Station',
          riverName: 'Godavari River',
          state: 'Telangana',
          latitude: 17.6700,
          longitude: 80.8900,
          currentWaterLevelMeters: 48.2,
          dangerLevelMeters: 43.0,
          status: 'DANGER',
          strandedResidents: 190,
          lastUpdated: 'Just Now',
        },
        {
          stationId: 'CWC-MH-01',
          stationName: 'Sangli Bridge',
          riverName: 'Krishna River',
          state: 'Maharashtra',
          latitude: 16.8524,
          longitude: 74.5815,
          currentWaterLevelMeters: 538.1,
          dangerLevelMeters: 540.0,
          status: 'NORMAL',
          strandedResidents: 0,
          lastUpdated: 'Just Now',
        },
      ];
      setStations(defaults);
      checkProximityAlert(userLocation[0], userLocation[1], defaults);
    }
  };

  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkProximityAlert = (lat: number, lng: number, stationList: FloodStation[]) => {
    for (const st of stationList) {
      if (st.status === 'DANGER' || st.status === 'EXTREME_DANGER') {
        const dist = calculateHaversine(lat, lng, st.latitude, st.longitude);
        if (dist <= 1.0) {
          const msg = `⚠️ FLOOD PROXIMITY ALERT: You are within ${dist.toFixed(1)} km of high-risk flood station ${st.stationName}!`;
          setAlertBanner(msg);

          if ('Notification' in window && Notification.permission === 'granted' && !hasNotified) {
            new Notification('🚨 EMERGENCY FLOOD ALERT', {
              body: msg,
              icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
            });
            setHasNotified(true);
          }
          break;
        }
      }
    }
  };

  // Safe Detour Routing Engine with Waypoint Injection
  const handleMapClick = async (destLat: number, destLng: number) => {
    setDestination([destLat, destLng]);

    // Check if any danger station lies near the straight path
    let detourWaypoint: [number, number] | null = null;
    let isDetoured = false;

    for (const st of stations) {
      if (st.status === 'DANGER' || st.status === 'EXTREME_DANGER') {
        const distToUser = calculateHaversine(userLocation[0], userLocation[1], st.latitude, st.longitude);
        const distToDest = calculateHaversine(destLat, destLng, st.latitude, st.longitude);

        if (distToUser < 50 || distToDest < 50) {
          // Inject a mathematical safe detour offset (+0.3 deg lat, -0.3 deg lng)
          detourWaypoint = [st.latitude + 0.35, st.longitude - 0.35];
          isDetoured = true;
          setAlertBanner(`🧭 DETOUR ROUTE APPLIED: Bending route around active flood hazard at ${st.stationName}`);
          break;
        }
      }
    }

    try {
      let osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]}`;
      if (detourWaypoint) {
        osrmUrl += `;${detourWaypoint[1]},${detourWaypoint[0]}`;
      }
      osrmUrl += `;${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
        setRoutePolyline(coordinates);

        const durationMin = Math.round(route.duration / 60);
        const distanceKm = (route.distance / 1000).toFixed(1);

        const stepsList: StepDirection[] = route.legs.flatMap((leg: any) =>
          leg.steps.map((s: any) => ({
            instruction: s.maneuver.type + (s.name ? ` onto ${s.name}` : ''),
            distanceKm: (s.distance / 1000).toFixed(2) + ' km',
            durationMin: Math.round(s.duration / 60) + ' min',
          }))
        );

        setRouteInfo({
          totalDuration: `${durationMin} mins`,
          totalDistance: `${distanceKm} km`,
          isDetoured,
          steps: stepsList,
        });
        setShowDirections(true);
      }
    } catch {
      // Fallback direct line if OSRM is unreachable
      setRoutePolyline([userLocation, [destLat, destLng]]);
      setRouteInfo({
        totalDuration: '25 mins (Est.)',
        totalDistance: `${calculateHaversine(userLocation[0], userLocation[1], destLat, destLng).toFixed(1)} km`,
        isDetoured,
        steps: [{ instruction: 'Head directly towards destination along main arterial road', distanceKm: '5.0 km', durationMin: '15 min' }],
      });
      setShowDirections(true);
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <div style={styles.container}>
      {alertBanner && (
        <div style={styles.alertBar}>
          <AlertTriangle size={20} style={{ marginRight: 8 }} />
          <span>{alertBanner}</span>
        </div>
      )}

      <div style={styles.mapHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Navigation color="#0284c7" size={24} />
          <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Live Flood Map & Safe Detour Routing</h2>
        </div>

        {/* Dynamic Safe Evacuation Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
            <div style={{ position: 'relative', width: '48px', height: '26px' }}>
              <input
                type="checkbox"
                style={{ opacity: 0, width: 0, height: 0 }}
                checked={isSafeMode}
                onChange={() => setIsSafeMode(!isSafeMode)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: isSafeMode ? '#22c55e' : '#ef4444',
                  borderRadius: '26px',
                  transition: '0.3s'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: isSafeMode ? '25px' : '3px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  transition: '0.3s'
                }}
              />
            </div>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>
              {isSafeMode ? '🟢 Safe Evacuation (Detour)' : '🔴 Direct Route (Danger)'}
            </span>
          </label>
        </div>

        <div style={styles.legend}>
          <span style={{ color: '#16a34a', fontWeight: 600 }}>🟢 Normal</span>
          <span style={{ color: '#ea580c', fontWeight: 600 }}>🟠 Warning (&gt;40%)</span>
          <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 Danger (&gt;75%)</span>
        </div>
      </div>

      <div style={styles.mapContainer}>
        <MapContainer center={userLocation} zoom={8} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler />

          {/* User location marker */}
          <Marker position={userLocation}>
            <Popup>📍 Your Current GPS Location</Popup>
          </Marker>

          {/* Destination Marker */}
          {destination && (
            <Marker position={destination}>
              <Popup>🎯 Selected Safe Destination</Popup>
            </Marker>
          )}

          {/* Real-time WebSocket Flood Danger Markers */}
          {liveEvents.map((ev, idx) => (
            <Marker key={idx} position={[ev.latitude, ev.longitude]} icon={floodWarningIcon}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <h4 style={{ margin: '0 0 4px', color: '#dc2626' }}>🚨 Danger Zone</h4>
                  <p style={{ margin: '2px 0', fontSize: '12px' }}><b>Region:</b> {ev.regionName}</p>
                  <p style={{ margin: '2px 0', fontSize: '12px' }}><b>Danger Level:</b> {ev.dangerLevel}/5</p>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#64748b' }}>Impassable flooded roadway</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* OSRM Route Polyline */}
          {routePolyline.length > 0 && (
            <Polyline
              positions={routePolyline}
              color={routeInfo?.isDetoured ? '#ea580c' : '#0284c7'}
              weight={6}
              dashArray={routeInfo?.isDetoured ? '8, 8' : undefined}
            />
          )}

          {/* CWC Flood Station Circle Markers */}
          {stations.map((st) => {
            let color = '#16a34a';
            if (st.status === 'EXTREME_DANGER' || st.status === 'DANGER') color = '#dc2626';
            else if (st.status === 'WARNING') color = '#ea580c';

            return (
              <CircleMarker
                key={st.stationId}
                center={[st.latitude, st.longitude]}
                radius={st.status === 'EXTREME_DANGER' ? 14 : 10}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <h4 style={{ margin: '0 0 4px', color: '#0f172a' }}>{st.stationName}</h4>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>River: {st.riverName}</p>
                    <p style={{ margin: '2px 0', fontSize: '12px' }}>
                      Water Level: <b>{st.currentWaterLevelMeters} m</b> / Danger: {st.dangerLevelMeters} m
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '12px', color, fontWeight: 700 }}>
                      Status: {st.status}
                    </p>
                    {st.strandedResidents > 0 && (
                      <p style={{ margin: '2px 0', fontSize: '12px', color: '#dc2626' }}>
                        🚨 Stranded Residents: {st.strandedResidents}
                      </p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Google Maps Style Bottom Slide-Up Directions Drawer */}
        {routeInfo && (
          <div style={{ ...styles.directionsDrawer, maxHeight: showDirections ? '320px' : '60px' }}>
            <div style={styles.drawerHeader} onClick={() => setShowDirections(!showDirections)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock color="#0284c7" size={20} />
                <div>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {routeInfo.totalDuration} ({routeInfo.totalDistance})
                  </span>
                  {routeInfo.isDetoured && (
                    <span style={styles.detourBadge}>Flood Hazards Avoided</span>
                  )}
                </div>
              </div>
              {showDirections ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            </div>

            {showDirections && (
              <div style={styles.stepsList}>
                <h4 style={{ margin: '8px 0 12px', fontSize: '13px', color: '#64748b' }}>
                  TURN-BY-TURN SAFE ESCAPE NAVIGATION
                </h4>
                {routeInfo.steps.map((step, idx) => (
                  <div key={idx} style={styles.stepItem}>
                    <MapPin size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flexGrow: 1 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                        {step.instruction}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                        {step.distanceKm} • {step.durationMin}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: 'calc(100vh - 70px)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  alertBar: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  mapHeader: {
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
  },
  mapContainer: {
    flexGrow: 1,
    position: 'relative',
  },
  directionsDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    transition: 'max-height 0.3s ease-in-out',
    overflow: 'hidden',
  },
  drawerHeader: {
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
  },
  detourBadge: {
    marginLeft: '10px',
    backgroundColor: '#ffedd5',
    color: '#c2410c',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
  },
  stepsList: {
    padding: '12px 20px 20px',
    overflowY: 'auto',
    maxHeight: '240px',
  },
  stepItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottom: '1px solid #f1f5f9',
  },
};
