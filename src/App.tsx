import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Sparkles, Car, Smartphone, ArrowRight, 
  HelpCircle, Wifi, Compass, Settings, AlertCircle, Info, Zap, Sun 
} from 'lucide-react';
import AndroidAutoSimulator from './components/AndroidAutoSimulator';
import PhoneAppSimulator from './components/PhoneAppSimulator';
import TechnicalAnalysis from './components/TechnicalAnalysis';
import { CentralSystemState, AppSettings } from './types';

export default function App() {
  // SINGLE CENTRAL SOURCE OF TRUTH (Model Unique de Estado)
  const [systemState, setSystemState] = useState<CentralSystemState>({
    glucoseValue: 112,
    trendArrow: 3,
    trendText: 'Estable',
    exactTimestamp: new Date().toISOString(),
    dataSource: 'Caché Local Room',
    freshness: 'fresh',
    connectivity: 'online',
    lastSuccessfulSyncTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    value: 112,
    timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    isRealData: false
  });

  // Global Settings state
  const [settings, setSettings] = useState<AppSettings>({
    thresholds: {
      criticalLow: 55,
      low: 70,
      high: 250
    },
    enableSound: true,
    enableVoice: true,
    viewMode: 'app-main-wake',
    activeSource: 'simulation'
  });

  // State for user helper tooltip/drawer
  const [showHelper, setShowHelper] = useState(true);

  // Close helper after 15 seconds automatically
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelper(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Decorative ambient visual background blur effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Elegant Header Area */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-50 backdrop-blur" id="pinnacle-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center p-2 text-white shadow-xl shadow-indigo-600/10">
              <Car className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white sm:text-lg flex items-center gap-1.5">
                LibreCar Display
                <span className="text-[10px] bg-indigo-950 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded-full border border-indigo-900/40">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Monitor permanente de glucosa libre de interacción</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicator pill based on active dataset source */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs">
              <span className={`w-2 h-2 rounded-full ${settings.activeSource === 'libre-link-up' ? 'bg-green-500 animate-ping' : 'bg-slate-500'}`}></span>
              <span className="text-slate-300 font-medium">
                Sincronización: {settings.activeSource === 'libre-link-up' ? 'FreeStyle Libre Link' : 'Simulador Manual'}
              </span>
            </div>

            <button
              onClick={() => setShowHelper(!showHelper)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition"
              title="Mostrar Ayuda Rápida"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8 w-full">
        
        {/* Quick Helper Banner */}
        <AnimatePresence>
          {showHelper && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
              id="top-quick-helper-banner"
            >
              <div className="bg-gradient-to-r from-indigo-950/60 to-slate-950/85 border border-indigo-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-3 text-left">
                  <div className="p-2 bg-indigo-950 border border-indigo-500/25 text-indigo-400 rounded-xl shrink-0 mt-0.5">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">¡Display Permanente de Glucosa Libre de Interacción!</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Esta aplicación funciona como un <strong>monitor en vivo</strong> accesible en todo momento en la pantalla del móvil en modo Always-On, en los widgets de la pantalla de inicio o en la pantalla de bloqueo mediante notificaciones de alta prioridad, sin usar reproductores multimedia que interrumpan tu música o navegadores preferidos.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowHelper(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 shrink-0 select-none cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Connected Simulators Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="active-workplace-grid">
          
          {/* ANDROID AUTO SCREEN SIMULATOR (Larger Viewport - Left Side) */}
          <div className="col-span-1 lg:col-span-8 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                VISUALIZADOR CONTINUO SIEMPRE ACTIVO
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Sun className="w-3.5 h-3.5" />
                Siempre encendido
              </div>
            </div>

            <AndroidAutoSimulator
              currentReading={systemState}
              settings={settings}
              onUpdateSettings={setSettings}
            />
          </div>

          {/* COMPANION PHONE SIMULATOR (Settings / Inputs - Right Side) */}
          <div className="col-span-1 lg:col-span-4 space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black text-slate-400 tracking-wider flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                MÓVIL DEL CONDUCTOR / COPILOTO
              </span>
              {systemState.isRealData ? (
                <span className="text-[10px] text-green-400 font-bold bg-green-950/40 px-2 py-0.5 rounded border border-green-500/20 flex items-center gap-1 animate-pulse">
                  <Wifi className="w-3 h-3" />
                  SENSOR CLOUD LIVE
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded">
                  MODO PRUEBA
                </span>
              )}
            </div>

            <PhoneAppSimulator
              currentReading={systemState}
              onUpdateReading={(updated: any) => {
                setSystemState(prev => {
                  const val = updated.value !== undefined ? updated.value : prev.glucoseValue;
                  const arrow = updated.trendArrow !== undefined ? updated.trendArrow : prev.trendArrow;
                  const txt = updated.trendText !== undefined ? updated.trendText : prev.trendText;
                  const isReal = updated.isRealData !== undefined ? updated.isRealData : prev.isRealData;
                  const readableTime = updated.timestamp || prev.timestamp;

                  // Infer details based on source
                  let srcUnit: any = 'Caché Local Room';
                  if (settings.activeSource === 'libre-link-up') {
                    srcUnit = 'LibreLinkUp';
                  } else if (settings.activeSource === 'nightscout') {
                    srcUnit = 'Nightscout';
                  }

                  // Determine stale status (if glucose hasn't changed for a long time, it's simulated as stale)
                  const freshVal = (val === 120 && settings.activeSource === 'simulation') ? 'unknown' : 'fresh';
                  const connVal = settings.activeSource === 'simulation' ? 'online' : (isReal ? 'online' : 'degraded');

                  return {
                    ...prev,
                    glucoseValue: val,
                    trendArrow: arrow,
                    trendText: txt,
                    exactTimestamp: new Date().toISOString(),
                    dataSource: srcUnit,
                    freshness: freshVal,
                    connectivity: connVal,
                    lastSuccessfulSyncTime: readableTime,
                    value: val,
                    timestamp: readableTime,
                    isRealData: isReal
                  };
                });
              }}
              settings={settings}
              onUpdateSettings={setSettings}
            />
          </div>

        </div>

        {/* MODELO ÚNICO DE ESTADO - PANEL DE CONTROL CENTRAL */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4" id="central-system-state-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] bg-indigo-950 text-indigo-400 font-bold tracking-widest px-2 py-0.5 rounded-full uppercase font-mono">
                Model: CentralSystemState
              </span>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mt-1">
                Único Modelo del Estado Central (Fuente Única de Verdad)
              </h2>
              <p className="text-xs text-slate-400">
                La UI, las notificaciones de alta prioridad y los widgets de pantalla de inicio consumen reactivamente este modelo unificado.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 text-[11px]">
              <span className="text-slate-500 font-mono">Última Sinc:</span>
              <span className="text-emerald-400 font-bold font-mono">{systemState.lastSuccessfulSyncTime}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            
            {/* Value (mg/dL) */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Glucosa Actual</span>
              <div className="my-1.5">
                <span className="text-2xl font-black text-white font-mono">{systemState.glucoseValue}</span>
                <span className="text-[10px] text-slate-400 font-bold ml-1 font-sans">mg/dL</span>
              </div>
              <span className={`text-[8.5px] px-2 py-0.5 rounded font-bold uppercase ${
                systemState.glucoseValue < settings.thresholds.criticalLow || systemState.glucoseValue > settings.thresholds.high
                  ? 'bg-rose-950/50 text-rose-300 border border-rose-900/40'
                  : 'bg-emerald-950/50 text-emerald-300 border border-emerald-900/40'
              }`}>
                {systemState.trendText}
              </span>
            </div>

            {/* Exact Timestamp */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Timestamp exacto</span>
              <div className="my-1 text-left">
                <p className="text-[10px] text-slate-300 truncate font-mono select-all leading-tight">
                  {systemState.exactTimestamp}
                </p>
                <p className="text-[8px] text-slate-500 mt-1">Lectura precisa del sensor registrada en milisegundos.</p>
              </div>
              <span className="text-[8px] font-mono text-zinc-500 bg-zinc-900/40 py-0.5 rounded">UTC Standard</span>
            </div>

            {/* Data Source */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Fuente de Datos</span>
              <div className="my-2">
                <span className="text-xs font-bold text-indigo-400 font-mono block uppercase">
                  {systemState.dataSource}
                </span>
                <p className="text-[8px] text-slate-500 mt-1">Origen inalterable de la información actual.</p>
              </div>
              <span className="text-[8.5px] text-zinc-400 font-mono bg-indigo-950/20 py-0.5 rounded border border-indigo-900/20">
                Fallback Local Room
              </span>
            </div>

            {/* Freshness */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Frescura (Freshness)</span>
              <div className="my-1.5 flex flex-col items-center">
                <span className={`w-3.5 h-3.5 rounded-full mb-1 flex items-center justify-center text-[8px] font-bold ${
                  systemState.freshness === 'fresh' ? 'bg-green-500 text-white' : 'bg-amber-500 text-slate-950'
                }`}>
                  ✓
                </span>
                <span className="text-xs font-black text-white capitalize font-mono">{systemState.freshness}</span>
              </div>
              <span className="text-[8px] text-slate-500 leading-tight">
                {systemState.freshness === 'fresh' ? 'Datos en rango (<5 min)' : 'Espera de sincronización'}
              </span>
            </div>

            {/* Connectivity */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-center flex flex-col justify-between">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Conectividad de Red</span>
              <div className="my-1.5 flex flex-col items-center">
                <span className={`w-2 h-2 rounded-full ${
                  systemState.connectivity === 'online' ? 'bg-green-400' : 'bg-amber-400 animate-pulse'
                }`}></span>
                <span className="text-xs font-black text-white uppercase font-mono mt-1">{systemState.connectivity}</span>
              </div>
              <span className="text-[8px] text-slate-500 leading-tight">
                {systemState.connectivity === 'online' ? 'Línea de red óptima' : 'Red en degradación'}
              </span>
            </div>

          </div>
        </div>

        {/* Visual Link Stream telemetry pipeline */}
        <div className="hidden lg:flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-900/20 rounded-xl p-3 border border-slate-900 border-dashed" id="telemetry-pipeline-display">
          <span className="font-semibold text-slate-400">RETRANSMISIÓN SINCRÓNICA:</span>
          <span>Frecuencia Freestyle</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-indigo-400 font-semibold">{systemState.dataSource}</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
          <span>Room SQLite</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
          <span>FGS + WorkManager</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 font-bold" />
          <span className="text-white font-medium bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
            {settings.viewMode.toUpperCase()}
          </span>
        </div>

        {/* Technical Article / Guidelines Area */}
        <div className="mt-4">
          <TechnicalAnalysis />
        </div>

      </main>

      {/* Humble Footer Area */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500 text-center" id="footer-reference">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="flex items-center justify-center gap-1 font-medium text-slate-400">
            Hecho con <Heart className="w-3 text-red-500 fill-red-500" /> para la comunidad con Diabetes. 
          </p>
          <p className="max-w-2xl mx-auto leading-relaxed text-slate-500">
            Aviso de Exención de Responsabilidad: Este simulador tiene únicamente fines didácticos, de investigación técnica y prototipado visual. Nunca confíe en simuladores web de terceros para decisiones médicas críticas de insulina o dosificación. Utilice siempre su glucómetro estándar y dispositivos Abbott certificados.
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            Licencia Apache-2.0 • Diseñado conforme a las políticas del programador de Google Play Console 2026
          </p>
        </div>
      </footer>

    </div>
  );
}
