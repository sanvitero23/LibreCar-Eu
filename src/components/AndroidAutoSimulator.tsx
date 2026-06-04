import { useState, useEffect } from 'react';
import { 
  Smartphone, Battery, Signal, ShieldCheck, Moon, RefreshCw, Eye, EyeOff,
  BellRing, AlertTriangle, Cpu, CheckCircle2, ChevronRight, Play, Volume2, Info, Terminal, Database
} from 'lucide-react';
import { GlucoseReading, AppSettings, AlertThresholds } from '../types';

interface AndroidAutoSimulatorProps {
  currentReading: GlucoseReading;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function AndroidAutoSimulator({
  currentReading,
  settings,
  onUpdateSettings,
}: AndroidAutoSimulatorProps) {
  const [keepScreenOnActive, setKeepScreenOnActive] = useState(true);
  const [notificationType, setNotificationType] = useState<'normal' | 'critical'>('normal');
  const [selectedBrand, setSelectedBrand] = useState<'samsung' | 'xiaomi' | 'pixel'>('samsung');
  
  // Simulated real-time Background Service Logs
  const [serviceLogs, setServiceLogs] = useState<string[]>([]);

  // Push new service logs sequentially when a new state or reading occurs
  useEffect(() => {
    const time = new Date().toLocaleTimeString('es-ES');
    setServiceLogs(prev => [
      `[${time}] [WorkManager] Ejecutando sincronización diferida resiliente en segundo plano`,
      `[${time}] [FGS] Hilo activo Best-Effort (Android podría pausar o retrasar en Doze/App Standby)`,
      `[${time}] [SYNC] Glucosa procesada: ${currentReading.value} mg/dL (Flecha: ${currentReading.trendArrow})`,
      `[${time}] [DB] Escritura transaccional Room SQLite completada como almacén local permanente`,
      `[${time}] [WIDGET] Intent de refresco pasivo recibido en AppWidgetProvider`,
      ...prev
    ].slice(0, 40));
  }, [currentReading.value, currentReading.trendArrow]);

  // Initializing log setup on start
  useEffect(() => {
    const time = new Date().toLocaleTimeString('es-ES');
    setServiceLogs([
      `[${time}] [WorkManager] Encolando tarea periódica de fondo (Sincronizador Diferido) `,
      `[${time}] [FGS] Foreground Service iniciado (Mejora la persistencia, pero no la garantiza al 100%)`,
      `[${time}] [SYSTEM] Principio de Diseño: Android es no determinista. Resiliencia local por diseño`,
      `[${time}] [DB] Caché local SQLite Room inicializada correctamente`
    ]);
  }, []);

  // Simulated widget last update timestamp
  const [widgetLastUpdate, setWidgetLastUpdate] = useState('Hace un momento');
  const [secondsSinceLastSync, setSecondsSinceLastSync] = useState(0);

  // Increment elapsed sync seconds to model accurate real-time data status
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceLastSync(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset timer on glucose value changes
  useEffect(() => {
    setSecondsSinceLastSync(0);
  }, [currentReading.value]);

  const formatElapsed = (sec: number) => {
    if (sec < 5) return 'Recibido ahora (Sincronizado)';
    return `Hace ${sec} segundos (Room DB Cache)`;
  };

  // Determine Range & Colors
  const getGlucoseStatus = (val: number, thresholds: AlertThresholds) => {
    if (val < thresholds.criticalLow) {
      return {
        label: 'HIPOGLUCEMIA CRÍTICA',
        colorClass: 'text-rose-500 bg-rose-950/40 border-rose-500',
        glowClass: 'shadow-rose-500/40 border-rose-500/80 bg-rose-950/20',
        textAccent: 'text-rose-400',
        textColor: 'text-rose-500',
        badge: 'bg-rose-600 text-white animate-pulse',
        recommendation: 'Gravedad extrema. Consume 15g de hidratos rápidos. Servidor en modo Alarma Máxima.'
      };
    } else if (val < thresholds.low) {
      return {
        label: 'TENDENCIA BAJA',
        colorClass: 'text-amber-400 bg-amber-950/40 border-amber-500/50',
        glowClass: 'shadow-amber-500/30 border-amber-500/50 bg-amber-950/20',
        textAccent: 'text-amber-400',
        textColor: 'text-amber-400',
        badge: 'bg-amber-500 text-slate-900 font-bold',
        recommendation: 'Nivel bajo detectado. Tu smartphone emitirá pitos discretos en caso de persistencia.'
      };
    } else if (val > thresholds.high) {
      return {
        label: 'CRÍTICA ALTA',
        colorClass: 'text-rose-400 bg-rose-950/40 border-rose-500',
        glowClass: 'shadow-rose-500/30 border-rose-500/80 bg-rose-950/40',
        textAccent: 'text-rose-400',
        textColor: 'text-rose-400',
        badge: 'bg-rose-600 text-white animate-pulse',
        recommendation: 'Hiperglucemia grave. Bebe agua abundante y evalúa corrección de insulina según pauta médica.'
      };
    } else {
      return {
        label: 'RANGO ÓPTIMO',
        colorClass: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/40',
        glowClass: 'shadow-emerald-500/15 border-emerald-500/40 bg-slate-900/60',
        textAccent: 'text-emerald-400',
        textColor: 'text-emerald-400',
        badge: 'bg-emerald-600 text-white',
        recommendation: 'Niveles seguros. El servicio en segundo plano continuará cacheando datos de forma pasiva.'
      };
    }
  };

  const status = getGlucoseStatus(currentReading.value, settings.thresholds);

  const getTrendIcon = (arrow: number) => {
    switch (arrow) {
      case 1: return { symbol: '↓', label: 'Bajando Rápido', color: 'text-rose-500' };
      case 2: return { symbol: '↘', label: 'Bajando', color: 'text-amber-400' };
      case 3: return { symbol: '→', label: 'Estable', color: 'text-emerald-400' };
      case 4: return { symbol: '↗', label: 'Subiendo', color: 'text-amber-400' };
      case 5: return { symbol: '↑', label: 'Subiendo Rápido', color: 'text-rose-500' };
      default: return { symbol: '→', label: 'Estable', color: 'text-emerald-400' };
    }
  };

  const trend = getTrendIcon(currentReading.trendArrow);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] w-full max-w-4xl mx-auto border-4" id="view-visualizer-main-frame">
      
      {/* Visualizer header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-3 text-left" id="visualizer-tabs-nav">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <h4 className="text-[11px] font-black tracking-widest text-white uppercase leading-none">Copiloto Glucosa LibreCar</h4>
            <p className="text-[9px] text-slate-400">Monitorización estable mediante foreground service, widgets y notificaciones estándar</p>
          </div>
        </div>

        {/* Realistic View Selector */}
        <div className="flex flex-wrap bg-slate-950 rounded-lg p-0.5 border border-slate-800/80 text-[10px] gap-0.5">
          {[
            { id: 'app-main-wake', label: '1. FLAG_KEEP_SCREEN_ON' },
            { id: 'app-notifications', label: '2. Notificaciones de Canal' },
            { id: 'app-widgets', label: '3. Widgets del Sistema' },
            { id: 'os-degradation-diagnose', label: '4. Logs del Foreground Service' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onUpdateSettings({ ...settings, viewMode: mode.id as any })}
              className={`px-3 py-1.5 rounded-md font-bold transition-all duration-150 cursor-pointer ${
                settings.viewMode === mode.id
                  ? 'bg-indigo-600 text-white shadow-lg font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inner Visual Space */}
      <div className="flex-1 flex min-h-0 bg-slate-950 relative" id="selected-workspace-viewport">
        
        {/* TAB 1: SCREEN KEEP ON (True reliable display pattern) */}
        {settings.viewMode === 'app-main-wake' && (
          <div className="flex-1 flex flex-col bg-black p-6 justify-between text-left h-full" id="view-app-main-wake">
            
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5 uppercase font-bold tracking-widest text-indigo-400">
                <Moon className="w-3.5 h-3.5" />
                Configuración: FLAG_KEEP_SCREEN_ON (Window API)
              </span>
              <button 
                onClick={() => setKeepScreenOnActive(!keepScreenOnActive)}
                className={`px-3 py-1 rounded text-[10px] font-bold font-sans transition cursor-pointer ${
                  keepScreenOnActive 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' 
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}
              >
                {keepScreenOnActive ? '• FLAG_KEEP_SCREEN_ON: ACTIVO (Primer Plano)' : '• FLAG_KEEP_SCREEN_ON: DESACTIVADO'}
              </button>
            </div>

            {/* Giant display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1 py-4">
              <div className="col-span-1 md:col-span-7 flex flex-col justify-center items-start space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                  Lectura en Pantalla (AMOLED friendly)
                </span>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-8xl font-black font-sans tracking-tighter text-white select-all">
                    {currentReading.value}
                  </span>
                  <span className="text-xl font-mono text-zinc-500">mg/dL</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-4xl filter drop-shadow font-extrabold ${trend.color}`}>
                    {trend.symbol}
                  </span>
                  <div>
                    <span className="text-sm font-black text-white block leading-tight">
                      {trend.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 leading-none block font-mono mt-0.5">
                      {formatElapsed(secondsSinceLastSync)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Local state details & Sparkline */}
              <div className="col-span-1 md:col-span-5 flex flex-col justify-between h-full space-y-4">
                
                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span>ESTADO CACHÉ LOCAL</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-normal">
                    {status.recommendation}
                  </p>
                </div>

                {/* SVG Live spark graph */}
                <div className="border border-zinc-900 bg-zinc-950/40 p-3 rounded-xl space-y-2 flex-1 flex flex-col justify-between">
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono tracking-wider">Histórico Caché Local (Últimas 3 Horas)</span>
                  
                  <div className="h-16 w-full relative overflow-hidden bg-black/60 rounded border border-zinc-950">
                    <svg className="w-full h-full text-indigo-400 stroke-current" strokeWidth="2.5" fill="none">
                      <path 
                        d={`M 10,48 Q 80,18 150,${45 - (currentReading.value - 100) * 0.15} T 350,${45 - (currentReading.value - 100) * 0.15}`} 
                        stroke={currentReading.value < settings.thresholds.low || currentReading.value > settings.thresholds.high ? '#f43f5e' : '#10b981'}
                        strokeWidth="3" 
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute top-1 left-2 text-[8px] font-mono text-zinc-600">250</div>
                    <div className="absolute bottom-1 left-2 text-[8px] font-mono text-zinc-600">70</div>
                  </div>

                  <div className="flex justify-between items-center text-[8px] text-zinc-600 font-mono">
                    <span>Persistencia: Room SQLite</span>
                    <span>Consumo batería: ~0.8%/h</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom guide */}
            <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-500 flex items-center justify-between">
              <span>Optimización: Apagado automático si el móvil detecta inactividad {">"}1h</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Seguridad Vial de Android
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: NATIVE CHANNELS NOTIFICATIONS (True lockscreen and Android Auto notification channel) */}
        {settings.viewMode === 'app-notifications' && (
          <div className="flex-1 bg-slate-900 p-5 flex items-center justify-center overflow-y-auto text-left w-full" id="view-app-notifications">
            <div className="w-full max-w-lg bg-stone-950 border border-stone-850 rounded-2xl p-4 space-y-4">
              
              <div className="flex justify-between items-center border-b border-stone-850 pb-2">
                <div>
                  <span className="text-[9.5px] uppercase font-bold text-stone-500 block font-mono">Simulador de Sistema Operativo</span>
                  <h4 className="text-xs font-black text-white">Canales de Alertas y Notificaciones Android (12–14)</h4>
                </div>
                
                {/* Switch between persistent background notification and high-urgency alarms */}
                <div className="flex bg-stone-900 rounded p-0.5 border border-stone-800 text-[9px] font-mono">
                  <button 
                    onClick={() => setNotificationType('normal')}
                    className={`px-2 py-1 rounded transition ${notificationType === 'normal' ? 'bg-indigo-600 text-white' : 'text-stone-400'}`}
                  >
                    FGS Persistente
                  </button>
                  <button 
                    onClick={() => setNotificationType('critical')}
                    className={`px-2 py-1 rounded transition ${notificationType === 'critical' ? 'bg-rose-600 text-white animate-pulse' : 'text-stone-400'}`}
                  >
                    Alerta Crítica
                  </button>
                </div>
              </div>

              {/* MAIN REPRODUCED NOTIFICATION VIEW */}
              {notificationType === 'normal' ? (
                /* Foreground Service Persistent notification */
                <div className="bg-stone-900/95 border border-stone-800 rounded-xl p-3.5 space-y-3.5 relative shadow-xl">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-900/80 text-indigo-300 flex items-center justify-center text-xs font-mono font-bold font-serif">
                        LC
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-300 block leading-tight">Servicio de Glucosa en Primer Plano</span>
                        <p className="text-[8.5px] text-zinc-500 font-mono">Monitoreando con LibreLinkUp/Nightscout de forma legal</p>
                      </div>
                    </div>
                    <span className="text-[8.5px] font-mono text-zinc-600">PERSISTENTE</span>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                    <div className="space-y-0.5">
                      <span className="text-xl font-extrabold text-white font-mono">{currentReading.value} mg/dL</span>
                      <span className="text-[9.5px] text-emerald-400 block font-medium">Estado: {status.label} {trend.symbol}</span>
                    </div>
                    <div className="text-right text-[8.5px] font-mono text-zinc-500">
                      <p>Sinc: {currentReading.timestamp}</p>
                      <p className="text-[8px] text-indigo-400">Sin impacto en Spotify</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Canal silencioso obligatorio en Android 13+ para evitar que el recolector de basura del SO detenga la sincronización en segundo plano.
                  </p>
                </div>
              ) : (
                /* Urgent diagnostic popup head-up banner for critical values */
                <div className="bg-rose-950/80 border-2 border-rose-500 rounded-xl p-4 space-y-3 relative shadow-2xl animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <div>
                        <span className="text-xs font-extrabold text-rose-300 uppercase tracking-wider">CANAL ALTAS PRIORIDADES (URGENCIA MÉDICA)</span>
                        <p className="text-[9px] text-rose-400/80 font-mono">Prioridad: IMPORTANCE_HIGH (Heads-up / Pop-up)</p>
                      </div>
                    </div>
                    <span className="bg-rose-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.2 rounded">CRÍTICA</span>
                  </div>

                  <div className="bg-black/80 p-3 rounded-lg border border-rose-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-black text-rose-400 font-sans tracking-tight">{currentReading.value}</span>
                      <span className="text-xs text-rose-300 font-mono ml-1">mg/dL • Tendencia {trend.symbol}</span>
                      <p className="text-[10px] text-zinc-300 mt-1">{status.recommendation}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-600 flex items-center justify-center text-xl">
                      {trend.symbol}
                    </div>
                  </div>

                  {/* TTS Speech Synthesis Integration */}
                  <div className="pt-2 border-t border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
                    <div className="text-left font-sans">
                      <span className="text-[9.5px] text-rose-300 font-mono flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                        Android TextToSpeech API (Oficial del Sistema)
                      </span>
                      <p className="text-[8.5px] text-zinc-500 mt-0.5 leading-tight">
                        Opcional y configurable. Sólo se activa en alertas críticas de glucemia (&lt;55 o &gt;250 mg/dL) para evitar fatiga auditiva.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (!settings.enableVoice) {
                          alert('La voz por sintetizador (TTS) está desactivada en los ajustes. Habilite "Voz Sintetizador" en los controles inferiores para poder probarlo.');
                          return;
                        }
                        const isCritical = currentReading.value < settings.thresholds.criticalLow || currentReading.value > settings.thresholds.high;
                        if (!isCritical) {
                          alert(`El TTS oficial de Android está configurado para ejecutarse exclusivamente ante alertas críticas. El valor actual (${currentReading.value} mg/dL) está en rango ordinario. Modifique el simulador para ingresar a un rango crítico y probar.`);
                          return;
                        }
                        
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          const utterance = new SpeechSynthesisUtterance(`Aviso de seguridad. Nivel de glucosa fuera de rango: ${currentReading.value} miligramos por decilitro. Tome medidas.`);
                          utterance.lang = 'es-ES';
                          window.speechSynthesis.speak(utterance);
                        } else {
                          console.log('Sintetizador WebSpeech no soportado.');
                        }
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[9.5px] font-bold rounded transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Play className="w-3 h-3" />
                      Probar TTS Oficial
                    </button>
                  </div>
                </div>
              )}

              {/* Informative advice on standard notifications */}
              <div className="bg-stone-900 border border-stone-800 p-3 rounded-lg text-[10px] text-stone-400 leading-relaxed flex gap-2">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-semibold">Canal de Notificaciones Estándar:</span> Las alertas se transmiten como notificaciones nativas de Android de prioridad médica. Son compatibles con Android Auto únicamente cuando el sistema operativo del teléfono y del vehículo decidan representarlas, sin presuponer un comportamiento visual uniforme ni consistencia de UI fija o presentación garantizada en pantalla.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: ANDROID WIDGETS (Home Screen visual widgets) */}
        {settings.viewMode === 'app-widgets' && (
          <div className="flex-1 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 p-6 flex flex-col justify-center items-center gap-5 text-left w-full" id="view-app-widgets">
            
            <div className="w-full max-w-lg bg-slate-950/95 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-900 pb-2">
                <span className="uppercase font-bold tracking-wider">MOCKUP: WIDGETS DE ESCRITORIO (APPWIDGETPROVIDER)</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  Sincronizado vía WorkManager
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1x1 Minimal widget */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider block font-mono">1. Burbuja Circular (1x1)</span>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-lg">
                    <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center bg-black ${
                      currentReading.value < settings.thresholds.low || currentReading.value > settings.thresholds.high
                        ? 'border-rose-500 text-rose-400'
                        : 'border-emerald-500 text-emerald-400'
                    }`}>
                      <span className="text-base font-extrabold font-mono leading-none">{currentReading.value}</span>
                      <span className="text-[7.5px] leading-none mt-0.5">{trend.symbol}</span>
                    </div>
                    <div className="text-[9.5px] text-slate-300 leading-tight">
                      <strong className="text-white block">Micro Widget:</strong>
                      Optimizado para el grid de la pantalla de inicio estándar.
                    </div>
                  </div>
                </div>

                {/* 4x1 Extended widget */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider block font-mono">2. Panel Informativo (4x1)</span>
                  <div className="bg-slate-900 border border-slate-700/60 p-2.5 rounded-xl flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                      currentReading.value < settings.thresholds.low || currentReading.value > settings.thresholds.high
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}></div>

                    <div className="pl-2 space-y-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white font-mono leading-none">{currentReading.value}</span>
                        <span className="text-[9px] font-mono text-slate-400">mg/dL</span>
                      </div>
                      <span className="text-[9px] text-slate-300 block">{trend.label} {trend.symbol}</span>
                    </div>

                    <div className="text-right text-[8.5px] font-mono text-slate-500 space-y-0.5 pr-1">
                      <p className="text-slate-400 font-semibold">{status.label.split(' ')[0]}</p>
                      <p>{widgetLastUpdate}</p>
                      <p>Sinc: Pasiva</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Simulation refresh widget trigger tool */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block font-mono">WorkManager / Intent Refresco</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Presionar el widget lanza un intent para forzar lectura bajo demanda.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setWidgetLastUpdate('Actualizado hace 1s');
                    setTimeout(() => setWidgetLastUpdate('Hace un momento'), 5000);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-500 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Presionar Widget
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: CONSOLE LOGS & STATIC MANUFACTURER RECOMMENDATIONS */}
        {settings.viewMode === 'os-degradation-diagnose' && (
          <div className="flex-1 bg-slate-950 p-5 flex flex-col justify-between h-full text-left overflow-y-auto max-h-[460px]" id="view-os-degradation-diagnose">
            
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2">
              <div>
                <span className="text-[10.5px] font-bold text-indigo-400 uppercase tracking-widest font-mono block">DIAGNÓSTICO No Determinista de Android</span>
                <p className="text-[9px] text-slate-400">Pautas de resiliencia frente a retrasos de red y limitadores de ahorro en segundo plano</p>
              </div>
            </div>

            {/* Core Architectural Principle Banner */}
            <div className="bg-indigo-950/40 border border-indigo-900/60 p-3 rounded-xl mb-3 text-xs leading-relaxed text-indigo-300">
              <span className="font-extrabold uppercase text-[10px] text-indigo-200 block mb-1">Principio de Diseño Resiliente</span>
              "Android es un entorno no determinista, por lo que el sistema debe ser resiliente por diseño, no dependiente de comportamiento garantizado del sistema operativo." El retraso en la recepción de datos motivado por Doze o App Standby es normal y esperado; la UI se adapta pasivamente sin falsas promesas.
            </div>

            {/* Selector de fabricante */}
            <div className="grid grid-cols-3 gap-2 my-1">
              {[
                { id: 'samsung', name: 'Guía Samsung OneUI', details: 'Ajuste estático "Nunca en suspensión"' },
                { id: 'xiaomi', name: 'Guía Xiaomi HyperOS', details: 'Configuración estática de Inicio Automático' },
                { id: 'pixel', name: 'Guía Pixel Stock', details: 'Ajuste manual de Optimización Adaptable' }
              ].map(brand => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.id as any)}
                  className={`p-2 rounded-xl text-left border text-xs transition duration-150 cursor-pointer ${
                    selectedBrand === brand.id 
                      ? 'bg-slate-900 border-indigo-500/80 text-white shadow-md font-extrabold' 
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <strong className="block text-[10px] text-white truncate">{brand.name}</strong>
                  <span className="text-[8px] text-slate-500 leading-tight block truncate mt-0.5">{brand.details}</span>
                </button>
              ))}
            </div>

            {/* Matrix columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 mt-2">
              
              {/* Left Column: Informative guide depending strictly on user action */}
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-amber-400 font-mono block">Guía Informativa Recomendada</span>
                  
                  {selectedBrand === 'samsung' && (
                    <div className="space-y-1.5 text-xs mt-1 leading-normal text-slate-400">
                      <p className="font-semibold text-white text-[11px]">Directriz Informativa Samsung:</p>
                      <p>
                        Se recomienda informar al usuario que OneUI puede ralentizar las corrutinas de hilos inactivos. Añadir la app manualmente a <b>"Aplicaciones nunca inactivas"</b> mejora el intervalo de entrega de datos, aunque el SO es soberano.
                      </p>
                      <p className="text-[9px] text-slate-500">
                        *No existe API automática para evadir este comportamiento estricto del kernel de Samsung.
                      </p>
                    </div>
                  )}

                  {selectedBrand === 'xiaomi' && (
                    <div className="space-y-1.5 text-xs mt-1 leading-normal text-slate-400">
                      <p className="font-semibold text-white text-[11px]">Directriz Informativa Xiaomi/HyperOS:</p>
                      <p>
                        Xiaomi aplica limitaciones térmicas y de ahorro agresivas. Se debe guiar al paciente a configurar manualmente el <b>"Inicio automático (Autostart)"</b> si detecta retrasos prolongados tras bloqueos del terminal.
                      </p>
                      <p className="text-[9px] text-slate-500">
                        *El sistema operativo suspenderá el servicio sin previo aviso en escenarios de temperatura elevada.
                      </p>
                    </div>
                  )}

                  {selectedBrand === 'pixel' && (
                    <div className="space-y-1.5 text-xs mt-1 leading-normal text-slate-400">
                      <p className="font-semibold text-white text-[11px]">Directriz Informativa Google Pixel:</p>
                      <p>
                        El ahorro adaptable nativo pone los módems en reposo parcial si no se detecta movimiento físico. WorkManager intentará reprogramar tareas diferidas de manera adaptativa.
                      </p>
                      <p className="text-[9px] text-slate-500">
                        *La consistencia absoluta no es garantizable ni compatible con la prolongación selectiva de batería.
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-[9px] bg-slate-950 p-2 rounded border border-slate-850 text-slate-500 font-mono">
                  <strong>Arquitectura compatible:</strong> El terminal recupera la continuidad al reactivar la pantalla leyendo de SQLite Room DB.
                </div>
              </div>

              {/* Right Column: Background Service Logs Console */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="space-y-1.5 flex flex-col h-full justify-between">
                  <span className="text-[9.5px] uppercase font-bold text-indigo-400 font-mono block flex items-center gap-1.5 leading-none">
                    <Terminal className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
                    Consola de Depuración (Comportamiento SO)
                  </span>
                  
                  <div className="bg-black/90 p-3 rounded-lg border border-slate-850 font-mono text-[9px] text-green-400 leading-relaxed overflow-y-auto h-28 max-h-[110px] select-all scrollbar-thin text-left">
                    {serviceLogs.length > 0 ? (
                      serviceLogs.map((log, i) => (
                        <p key={i} className="truncate select-text">{log}</p>
                      ))
                    ) : (
                      <p className="text-slate-600 font-mono">Monitoreando cola de WorkManager...</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500 bg-slate-950 px-2 py-1.5 border border-slate-850 rounded">
                  <span>SQLite Room DB: Activo</span>
                  <span>WorkManager: Encolado</span>
                  <span>FGS: Best-Effort</span>
                </div>
              </div>

            </div>

            {/* Offline degradation strategy banner */}
            <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-400 bg-indigo-950/15 p-2 rounded-lg border border-indigo-900/30 flex items-center justify-between">
              <span><strong>Estrategia de Sincronización:</strong> Ante caídas de red o Doze, el sistema se acopla de manera diferida mediante WorkManager, leyendo del repositorio persistente local Room de forma segura.</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
