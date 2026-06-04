import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Wifi, Database, KeyRound, User, Sliders, Play, Pause, AlertTriangle, 
  RefreshCw, Volume2, VolumeX, Eye, EyeOff 
} from 'lucide-react';
import { GlucoseReading, LibreAuthState, AppSettings, LibreConnection } from '../types';

interface PhoneAppSimulatorProps {
  currentReading: GlucoseReading;
  onUpdateReading: (reading: GlucoseReading) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function PhoneAppSimulator({
  currentReading,
  onUpdateReading,
  settings,
  onUpdateSettings,
}: PhoneAppSimulatorProps) {
  // Authentication states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('EU');
  const [showPassword, setShowPassword] = useState(false);
  const [authState, setAuthState] = useState<LibreAuthState>({
    token: null,
    baseUrl: null,
    email: '',
    selectedConnectionId: '',
    selectedConnectionName: '',
    connections: [],
    isLoading: false,
    error: null
  });

  // Simulation fluctuation state
  const [simFluctuation, setSimFluctuation] = useState(false);

  // Nightscout States
  const [nsUrl, setNsUrl] = useState(settings.nightscoutUrl || '');
  const [nsToken, setNsToken] = useState(settings.nightscoutToken || '');
  const [nsConnected, setNsConnected] = useState(false);
  const [nsError, setNsError] = useState<string | null>(null);
  const [nsIsLoading, setNsIsLoading] = useState(false);

  // Fetch Nightscout Reading
  const fetchNightscoutReading = async (urlVal?: string, tokenVal?: string) => {
    const targetUrl = urlVal || nsUrl;
    const targetToken = tokenVal || nsToken;

    if (!targetUrl) return;

    setNsIsLoading(true);
    setNsError(null);

    try {
      const response = await fetch(
        `/api/nightscout/readings?url=${encodeURIComponent(targetUrl)}&token=${encodeURIComponent(targetToken)}`
      );

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.error || 'Error de conexión con el servidor Nightscout.');
      }

      const entries = await response.json();
      
      if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('No se encontraron lecturas de glucosa (SGV) válidas en Nightscout.');
      }

      const latest = entries[0];
      if (latest && latest.sgv) {
        let trendVal = 3;
        const dir = (latest.direction || '').toLowerCase();
        if (dir.includes('doubleup') || dir.includes('upup')) trendVal = 5;
        else if (dir.includes('up') || dir.includes('fortyfiveup')) trendVal = 4;
        else if (dir.includes('doubledown') || dir.includes('downdown')) trendVal = 1;
        else if (dir.includes('down') || dir.includes('fortyfivedown')) trendVal = 2;
        else trendVal = 3;

        onUpdateReading({
          value: latest.sgv,
          trendArrow: trendVal,
          trendText: arrowToText(trendVal),
          timestamp: new Date(latest.date || Date.now()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isRealData: true
        });

        setNsConnected(true);
        setNsError(null);
      } else {
        throw new Error('La respuesta de Nightscout no contiene un valor de glucosa (SGV) descifrable.');
      }
    } catch (err: any) {
      setNsError(err.message || 'Error de conexión con Nightscout.');
      setNsConnected(false);
    } finally {
      setNsIsLoading(false);
    }
  };

  const handleNightscoutConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nsUrl) return;
    
    onUpdateSettings({
      ...settings,
      activeSource: 'nightscout',
      nightscoutUrl: nsUrl,
      nightscoutToken: nsToken
    });

    fetchNightscoutReading(nsUrl, nsToken);
  };

  const handleNightscoutDisconnect = () => {
    setNsConnected(false);
    setNsError(null);
    onUpdateSettings({
      ...settings,
      activeSource: 'simulation'
    });
  };

  // Manual values for simulation quick presets
  const presets = [
    { label: 'Baja Crítica (<55)', value: 52, arrow: 2, text: 'Bajando' },
    { label: 'Baja (<70)', value: 64, arrow: 1, text: 'Bajando rápido' },
    { label: 'Estable (Est)', value: 112, arrow: 3, text: 'Estable' },
    { label: 'Ascendiendo', value: 165, arrow: 4, text: 'Subiendo' },
    { label: 'Alta (>250)', value: 275, arrow: 5, text: 'Subiendo rápido' },
  ];

  // Map arrow values to text
  const arrowToText = (arrow: number): string => {
    switch (arrow) {
      case 1: return 'Bajando rápido';
      case 2: return 'Bajando';
      case 3: return 'Estable';
      case 4: return 'Subiendo';
      case 5: return 'Subiendo rápido';
      default: return 'Estable';
    }
  };

  // Set preset
  const handlePreset = (val: number, arrowVal: number) => {
    onUpdateReading({
      value: val,
      trendArrow: arrowVal,
      trendText: arrowToText(arrowVal),
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    });
  };

  // Custom Audio Synthesizer Beeps
  const triggerAudioBeep = (freq: number, duration: number, count: number = 1) => {
    if (!settings.enableSound) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const playSingleBeep = (delay: number) => {
        setTimeout(() => {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }, delay);
      };

      for (let i = 0; i < count; i++) {
        playSingleBeep(i * 300);
      }
    } catch (e) {
      console.warn("AudioContext fue bloqueado o no es compatible", e);
    }
  };

  // Text To Speech
  const triggerVoiceAlert = (text: string) => {
    if (!settings.enableVoice) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Monitor glucose changes to trigger visual/audible alarms
  useEffect(() => {
    const val = currentReading.value;
    const thresh = settings.thresholds;

    if (val < thresh.criticalLow) {
      // Critical low alarm
      triggerAudioBeep(650, 0.45, 3);
      triggerVoiceAlert(`Alerta crítica: Glucosa extremadamente baja de ${val} miligramos por decilitro. Detenga el vehículo.`);
    } else if (val < thresh.low) {
      // Low glucose alarm
      triggerAudioBeep(520, 0.35, 2);
      triggerVoiceAlert(`Atención: Glucosa baja de ${val} miligramos por decilitro.`);
    } else if (val > thresh.high) {
      // High glucose alarm
      triggerAudioBeep(440, 0.3, 2);
      triggerVoiceAlert(`Atención: Glucosa elevada de ${val} miligramos por decilitro.`);
    }
  }, [currentReading.value]);

  // Handle fluctuation interval
  useEffect(() => {
    let interval: any = null;
    if (simFluctuation && settings.activeSource === 'simulation') {
      interval = setInterval(() => {
        // Compute drift
        const diff = Math.floor(Math.random() * 7) - 3; // -3 to +3 mg/dL
        let nextValue = currentReading.value + diff;
        if (nextValue < 40) nextValue = 40;
        if (nextValue > 400) nextValue = 400;

        let nextArrow = currentReading.trendArrow;
        if (diff > 1) nextArrow = 4; // up
        else if (diff < -1) nextArrow = 2; // down
        else nextArrow = 3; // stable

        // Rare rapid jumps
        if (Math.random() > 0.85) {
          const rapidDiff = Math.random() > 0.5 ? 8 : -8;
          nextValue = Math.min(Math.max(nextValue + rapidDiff, 40), 400);
          nextArrow = rapidDiff > 0 ? 5 : 1; 
        }

        onUpdateReading({
          value: nextValue,
          trendArrow: nextArrow,
          trendText: arrowToText(nextArrow),
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        });
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [simFluctuation, currentReading.value, settings.activeSource]);

  // Authenticate with backend proxy to LibreLinkUp
  const handleLibreLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/libre/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, region })
      });

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.error || 'Fallo de autenticación con Abbott Cloud.');
      }

      const resData = await response.json();
      const loadedConnections = resData.connections || [];
      
      let nextSelectedConnectionId = '';
      let nextSelectedName = '';
      
      if (loadedConnections.length > 0) {
        nextSelectedConnectionId = loadedConnections[0].id;
        nextSelectedName = `${loadedConnections[0].firstName} ${loadedConnections[0].lastName}`;
      }

      setAuthState({
        token: resData.token,
        baseUrl: resData.baseUrl,
        email: email,
        selectedConnectionId: nextSelectedConnectionId,
        selectedConnectionName: nextSelectedName,
        connections: loadedConnections,
        isLoading: false,
        error: null
      });

      onUpdateSettings({
        ...settings,
        activeSource: 'libre-link-up'
      });

      // Show immediate glucose value if available in connection metadata
      if (loadedConnections.length > 0 && loadedConnections[0].glucoseMeasurement) {
        const sensorGluc = loadedConnections[0].glucoseMeasurement;
        onUpdateReading({
          value: sensorGluc.Value,
          trendArrow: sensorGluc.TrendArrow || 3,
          trendText: arrowToText(sensorGluc.TrendArrow || 3),
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isRealData: true
        });
      }

    } catch (err: any) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || 'Error de conexión' 
      }));
    }
  };

  // Poll for latest readings from LibreConnection
  const fetchLatestReading = async () => {
    if (!authState.token || !authState.baseUrl || !authState.selectedConnectionId) return;

    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(
        `/api/libre/readings?baseUrl=${encodeURIComponent(authState.baseUrl)}&connectionId=${authState.selectedConnectionId}`, 
        {
          headers: {
            'Authorization': `Bearer ${authState.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('No se pudieron recuperar las lecturas activas');
      }

      const rawData = await response.json();
      const currentRealtime = rawData.realtimeGlucose;

      if (currentRealtime) {
        onUpdateReading({
          value: currentRealtime.Value,
          trendArrow: currentRealtime.TrendArrow || 3,
          trendText: currentRealtime.TrendMessage || arrowToText(currentRealtime.TrendArrow || 3),
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          isRealData: true
        });
        setAuthState(prev => ({ ...prev, isLoading: false, error: null }));
      } else {
        // Fallback connections update
        const conResponse = await fetch(`/api/libre/connections?baseUrl=${encodeURIComponent(authState.baseUrl!)}`, {
          headers: {
            'Authorization': `Bearer ${authState.token!}`
          }
        });
        if (conResponse.ok) {
          const loadedConnections = await conResponse.json();
          const targetCon = loadedConnections.find((c: any) => c.id === authState.selectedConnectionId);
          if (targetCon && targetCon.glucoseMeasurement) {
            const sensorGluc = targetCon.glucoseMeasurement;
            onUpdateReading({
              value: sensorGluc.Value,
              trendArrow: sensorGluc.TrendArrow || 3,
              trendText: arrowToText(sensorGluc.TrendArrow || 3),
              timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              isRealData: true
            });
          }
        }
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }

    } catch (err: any) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  // Auto poll every 45s when using LibreLinkUp
  useEffect(() => {
    let pollInterval: any = null;
    if (settings.activeSource === 'libre-link-up' && authState.token) {
      pollInterval = setInterval(() => {
        fetchLatestReading();
      }, 45000);
    }
    return () => clearInterval(pollInterval);
  }, [settings.activeSource, authState.token, authState.selectedConnectionId]);

  // Auto poll every 45s when using Nightscout
  useEffect(() => {
    let pollInterval: any = null;
    if (settings.activeSource === 'nightscout' && nsUrl && nsConnected) {
      pollInterval = setInterval(() => {
        fetchNightscoutReading();
      }, 45000);
    }
    return () => clearInterval(pollInterval);
  }, [settings.activeSource, nsUrl, nsConnected]);

  // Disconnect from Libre connection
  const handleDisconnect = () => {
    setAuthState({
      token: null,
      baseUrl: null,
      email: '',
      selectedConnectionId: '',
      selectedConnectionName: '',
      connections: [],
      isLoading: false,
      error: null
    });
    onUpdateSettings({
      ...settings,
      activeSource: 'simulation'
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col w-full max-w-sm mx-auto" id="companion-phone-mockup">
      {/* Phone Status bar */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-2 mb-2">
        <span className="flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-indigo-400" />
          MÓVIL COMPLEMENTARIO
        </span>
        <div className="flex items-center gap-1.5">
          <span>{settings.activeSource === 'libre-link-up' ? 'ABBOTT CLOUD' : 'SIMULACIÓN'}</span>
          <Wifi className={`w-3 h-3 ${settings.activeSource === 'libre-link-up' ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
        </div>
      </div>

      {/* Screen frame */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex-1 flex flex-col gap-4 text-slate-200">
        
        {/* Title */}
        <div className="border-b border-slate-800 pb-3" id="phone-app-header">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            LibreCar Companion App
          </h1>
          <p className="text-[10px] text-slate-400">Emisor de telemetría de glucosa en tiempo real</p>
        </div>

        {/* Source Toggle Selector */}
        <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px] gap-0.5">
          <button
            onClick={() => {
              onUpdateSettings({ ...settings, activeSource: 'simulation' });
              setSimFluctuation(false);
            }}
            className={`py-1.5 rounded-md font-bold transition text-center ${
              settings.activeSource === 'simulation'
                ? 'bg-slate-800 text-white shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Simulador
          </button>
          
          <button
            onClick={() => onUpdateSettings({ ...settings, activeSource: 'libre-link-up' })}
            className={`py-1.5 rounded-md font-bold transition text-center ${
              settings.activeSource === 'libre-link-up'
                ? 'bg-slate-800 text-white shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            LibreLinkUp
          </button>

          <button
            onClick={() => onUpdateSettings({ ...settings, activeSource: 'nightscout' })}
            className={`py-1.5 rounded-md font-bold transition text-center ${
              settings.activeSource === 'nightscout'
                ? 'bg-slate-800 text-white shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Nightscout
          </button>
        </div>

        {/* Dynamic Panels */}
        <div className="flex-1 space-y-4" id="source-settings-container">
          {settings.activeSource === 'simulation' ? (
            /* SIMULATION CONTROLS */
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    Controles de Simulación
                  </h3>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-white font-mono">
                    {currentReading.value} mg/dL
                  </span>
                </div>

                {/* Slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min="40"
                    max="400"
                    value={currentReading.value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onUpdateReading({
                        ...currentReading,
                        value: val,
                        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                      });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>40 mg/dL</span>
                    <span>120 (Normal)</span>
                    <span>400 mg/dL</span>
                  </div>
                </div>

                {/* Presets */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 block font-medium">Glucosa Presets:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePreset(p.value, p.arrow)}
                        className={`text-[9.5px] px-2 py-1 rounded-md border font-semibold flex items-center gap-0.5 transition ${
                          currentReading.value === p.value 
                            ? 'bg-slate-800 text-indigo-400 border-indigo-500/50 shadow'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {p.value} ({p.label.split(' ')[0]})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trend Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] text-slate-400 block font-medium">Flecha de Tendencia:</label>
                  <div className="grid grid-cols-5 gap-1 text-[11px]">
                    {[
                      { val: 1, sym: '⬇️', txt: 'Bajando Rápido' },
                      { val: 2, sym: '↘️', txt: 'Bajando' },
                      { val: 3, sym: '➡️', txt: 'Estable' },
                      { val: 4, sym: '↗️', txt: 'Subiendo' },
                      { val: 5, sym: '⬆️', txt: 'Subiendo Rápido' },
                    ].map((t) => (
                      <button
                        key={t.val}
                        onClick={() => onUpdateReading({
                          ...currentReading,
                          trendArrow: t.val,
                          trendText: t.txt
                        })}
                        className={`py-1 rounded border text-center transition font-semibold ${
                          currentReading.trendArrow === t.val
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                            : 'bg-slate-950 border-slate-850 hover:bg-slate-800 text-slate-300'
                        }`}
                        title={t.txt}
                      >
                        {t.sym}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Noise interval toggle */}
                <button
                  onClick={() => setSimFluctuation(!simFluctuation)}
                  className={`w-full py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    simFluctuation 
                      ? 'bg-green-600/10 text-green-400 border-green-500/40 animate-pulse' 
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {simFluctuation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {simFluctuation ? 'Fluctuando CGM en Vivo' : 'Comenzar Telemetría Dinámica'}
                </button>
              </div>
            </div>
          ) : settings.activeSource === 'libre-link-up' ? (
            /* REAL LIBRELINKUP INTEGRATION */
            <div className="space-y-3">
              {!authState.token ? (
                /* LOGIN FORM */
                <form onSubmit={handleLibreLogin} className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-3 font-sans">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-indigo-400 mb-1">
                    <Database className="w-3.5 h-3.5" />
                    Acceso LibreLinkUp Cloud
                  </div>

                  {/* Region */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-medium">Región de Abbott:</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-300 outline-none focus:border-indigo-500"
                    >
                      <option value="EU">Europa (Recomendado)</option>
                      <option value="US">Estados Unidos</option>
                      <option value="CA">Canadá</option>
                      <option value="AU">Australia</option>
                      <option value="AP">Asia Pacífico</option>
                      <option value="JP">Japón</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-medium">Email (Cuidador/LibreLinkUp):</label>
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-300 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-medium">Contraseña:</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-300 outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {authState.error && (
                    <div className="text-[9.5px] p-2 bg-red-950/40 border border-red-500/20 text-red-300 rounded flex gap-1 items-start">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{authState.error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authState.isLoading}
                    className="w-full py-1.5 bg-indigo-600 rounded-lg text-xs font-bold text-white shadow hover:bg-indigo-500 transition disabled:opacity-50 mt-1 flex items-center justify-center gap-1.5"
                  >
                    {authState.isLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    {authState.isLoading ? 'Iniciando sesión...' : 'Iniciar Sincronización'}
                  </button>
                </form>
              ) : (
                /* LOGGED IN AND POLLING */
                <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-3 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] bg-green-950/60 text-green-400 font-bold px-2 py-0.5 rounded border border-green-500/25 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                      CONECTADO CLOUD
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="text-[9.5px] text-red-400 hover:text-red-300 underline"
                    >
                      Desconectar
                    </button>
                  </div>

                  {/* List Connections (Patients) */}
                  <div className="space-y-1.5 border-t border-slate-800 pt-2">
                    <label className="text-[10px] text-slate-400 block font-medium">Paciente / Conexión Activa:</label>
                    <div className="bg-slate-950 border border-slate-850 rounded-lg p-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="text-xs min-w-0">
                           <p className="font-semibold text-white truncate">{authState.selectedConnectionName || 'Paciente'}</p>
                           <p className="text-[9px] text-slate-500 truncate">ID: {authState.selectedConnectionId.substring(0, 12)}...</p>
                        </div>
                      </div>

                      <button
                        onClick={fetchLatestReading}
                        disabled={authState.isLoading}
                        className="p-1.5 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 text-slate-300 disabled:opacity-50 shrink-0"
                        title="Actualizar Glucosa"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${authState.isLoading ? 'animate-spin text-indigo-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Multi connections selection */}
                  {authState.connections.length > 1 && (
                    <div className="space-y-1 text-xs">
                      <label className="text-[10px] text-slate-400">Cambiar de paciente:</label>
                      <div className="space-y-1 max-h-[75px] overflow-y-auto pr-1">
                        {authState.connections.map((conn) => (
                          <button
                            key={conn.id}
                            onClick={() => {
                              setAuthState(prev => ({
                                ...prev,
                                selectedConnectionId: conn.id,
                                selectedConnectionName: `${conn.firstName} ${conn.lastName}`
                              }));
                            }}
                            className={`w-full text-left p-1 text-[10.5px] rounded border transition ${
                              authState.selectedConnectionId === conn.id 
                                ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300 font-medium' 
                                : 'bg-slate-950 border-slate-850 hover:bg-slate-800 text-slate-400 font-sans'
                            }`}
                          >
                            {conn.firstName} {conn.lastName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-910">
                    <span className="font-semibold text-indigo-300 font-sans">CGM Sincronizado:</span> Se consultan y actualizan automáticamente las lecturas desde Abbott Cloud cada 45 segundos.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* REAL NIGHTSCOUT INTEGRATION */
            <div className="space-y-3">
              {!nsConnected ? (
                /* NIGHTSCOUT CONFIG FORM */
                <form onSubmit={handleNightscoutConnect} className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-3 font-sans">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-emerald-400 mb-1">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    Fallback: Servidor Nightscout
                  </div>

                  {/* Server URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-medium">URL del Servidor Nightscout:</label>
                    <input
                      type="url"
                      required
                      placeholder="https://su-instancia.herokuapp.com"
                      value={nsUrl}
                      onChange={(e) => setNsUrl(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-300 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {/* API Secret / Access Token */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-medium">Token o API Secret (Opcional):</label>
                    <input
                      type="password"
                      placeholder="Identificador api-secret"
                      value={nsToken}
                      onChange={(e) => setNsToken(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-300 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  {nsError && (
                    <div className="text-[9.5px] p-2 bg-red-950/40 border border-red-500/20 text-red-300 rounded flex gap-1 items-start font-sans">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{nsError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={nsIsLoading}
                    className="w-full py-1.5 bg-emerald-600 rounded-lg text-xs font-bold text-white shadow hover:bg-emerald-500 transition disabled:opacity-50 mt-1 flex items-center justify-center gap-1.5 font-sans"
                  >
                    {nsIsLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {nsIsLoading ? 'Conectando...' : 'Guardar y Sincronizar'}
                  </button>
                </form>
              ) : (
                /* NIGHTSCOUT ACTIVE POLLING SCREEN */
                <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-3 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] bg-green-950/60 text-green-400 font-bold px-2 py-0.5 rounded border border-green-500/25 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                      NIGHTSCOUT ACTIVO
                    </div>
                    <button
                      onClick={handleNightscoutDisconnect}
                      className="text-[9.5px] text-red-400 hover:text-red-300 underline font-semibold font-sans"
                    >
                      Desconectar
                    </button>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-800 pt-2 text-xs">
                    <label className="text-[10px] text-slate-400 block font-medium">Servidor Enlazado:</label>
                    <div className="bg-slate-950 border border-slate-850 p-2 rounded-lg font-mono text-[10.5px] truncate text-slate-300 flex items-center justify-between gap-1">
                      <span>{nsUrl}</span>
                      <button
                        onClick={() => fetchNightscoutReading()}
                        disabled={nsIsLoading}
                        className="p-1 hover:bg-slate-800 text-slate-400 rounded transition disabled:opacity-50 shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${nsIsLoading ? 'animate-spin text-indigo-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-950 p-2 text-left rounded-lg border border-slate-910 leading-normal">
                    <span className="font-semibold text-emerald-400 font-sans">Canal de Fallback Robusto:</span> Si LibreLinkUp falla o presenta restricciones momentáneas, la retransmisión continuará de manera estable a través de Nightscout de forma paralela.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ALERTS SETTINGS SUB-CARD */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
          <h4 className="text-[10.5px] font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Urgencias & Alertas Sonoras</span>
            <span className="text-[9px] text-slate-500">Ajustar Límites</span>
          </h4>

          {/* Sound Controls Switches */}
          <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300">
            <button
              onClick={() => onUpdateSettings({ ...settings, enableSound: !settings.enableSound })}
              className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition font-semibold truncate justify-center ${
                settings.enableSound 
                  ? 'bg-slate-800 border-indigo-500/40 text-indigo-400' 
                  : 'bg-slate-950 border-slate-850 text-slate-500'
              }`}
            >
              {settings.enableSound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Zumbido Pito</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ ...settings, enableVoice: !settings.enableVoice })}
              className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition font-semibold truncate justify-center ${
                settings.enableVoice 
                  ? 'bg-slate-800 border-indigo-500/40 text-indigo-400' 
                  : 'bg-slate-950 border-slate-850 text-slate-500'
              }`}
            >
              {settings.enableVoice ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Voz Sintetizador</span>
            </button>
          </div>

          {/* Alert visual thresholds values fields */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div className="bg-slate-950 p-1 rounded border border-slate-850">
              <span className="text-red-400 font-bold">Crítica Baja</span>
              <p className="text-slate-200 mt-0.5 font-mono">{"<"}{settings.thresholds.criticalLow}</p>
            </div>
            <div className="bg-slate-950 p-1 rounded border border-slate-850">
              <span className="text-amber-400 font-bold">Atención</span>
              <p className="text-slate-200 mt-0.5 font-mono">{"<"}{settings.thresholds.low}</p>
            </div>
            <div className="bg-slate-950 p-1 rounded border border-slate-850">
              <span className="text-red-400 font-bold">Crítica Alta</span>
              <p className="text-slate-200 mt-0.5 font-mono">{">"}{settings.thresholds.high}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
