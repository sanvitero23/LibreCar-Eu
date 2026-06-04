export type DataSourceUnit = 'LibreLinkUp' | 'Nightscout' | 'Caché Local Room';
export type DataFreshness = 'fresh' | 'stale' | 'unknown';
export type ConnectivityStatus = 'online' | 'degraded' | 'offline';

export interface CentralSystemState {
  glucoseValue: number; // always in mg/dL
  trendArrow: number; // 1: DownDown, 2: Down, 3: Flat, 4: Up, 5: UpUp, other: None
  trendText: string;
  exactTimestamp: string; // Exact ISO or millisecond-based reading timestamp
  dataSource: DataSourceUnit;
  freshness: DataFreshness;
  connectivity: ConnectivityStatus;
  lastSuccessfulSyncTime: string;
  errorLog?: string;

  // Compatibility properties for UI continuity:
  value: number; // maps to glucoseValue
  timestamp: string; // readable local string format
  isRealData?: boolean;
}

export interface GlucoseReading {
  value: number; // always in mg/dL
  trendArrow: number; // 1: DownDown, 2: Down, 3: Flat, 4: Up, 5: UpUp, other: None
  trendText: string;
  timestamp: string;
  isRealData?: boolean;
}


export interface LibreConnection {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  targetLow: number;
  targetHigh: number;
  uom: number; // 1 = mg/dL, 2 = mmol/L
}

export interface LibreAuthState {
  token: string | null;
  baseUrl: string | null;
  email: string;
  selectedConnectionId: string;
  selectedConnectionName: string;
  connections: LibreConnection[];
  isLoading: boolean;
  error: string | null;
}

export interface AlertThresholds {
  criticalLow: number; // 55 mg/dL
  low: number; // 70 mg/dL
  high: number; // 250 mg/dL
}

export interface AppSettings {
  thresholds: AlertThresholds;
  enableSound: boolean;
  enableVoice: boolean;
  viewMode: 'app-main-wake' | 'app-notifications' | 'app-widgets' | 'os-degradation-diagnose';
  activeSource: 'simulation' | 'libre-link-up' | 'nightscout';
  nightscoutUrl?: string;
  nightscoutToken?: string;
}

