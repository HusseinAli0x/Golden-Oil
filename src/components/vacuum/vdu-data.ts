// Generated from design/Technology.dc.html (Vacuum Distillation Unit scene data).
/** Pre-rendered fallback frames (no-WebGL), scrubbed by scroll progress. */
export const VDU_FRAMES: readonly string[] = Array.from({ length: 90 }, (_, i) => `/vdu/frames/${String(i).padStart(2, "0")}.jpg`);

/** Arabic names for the small 3D part labels. */
export const VDU_AR: Record<string, string> = {
  "Demister pad": "وسادة فصل الرذاذ",
  "Overhead vapor outlet": "مخرج البخار العلوي",
  "Pumparound distributor": "موزّع الدورة الجانبية",
  "LVGO packed bed": "حشوة LVGO",
  "Chimney collector tray": "صينية تجميع بمداخن",
  "Bed support beams": "عوارض دعم الحشوة",
  "HVGO packed bed": "حشوة HVGO",
  "Collector tray · draw sump": "صينية تجميع · حوض السحب",
  "Wash-oil spray nozzles": "فوهات رش زيت الغسيل",
  "Wash bed": "حشوة الغسيل",
  "Vapor horn · flash zone": "قرن البخار · منطقة الوميض",
  "Stripping trays": "صواني التجريد",
  "Steam sparger": "موزّع البخار",
  "Manway": "فتحة تفتيش",
  "Thermowells": "أغلفة قياس الحرارة",
  "Liquid level": "مستوى السائل",
  "Vortex breaker": "كاسر الدوامة",
  "Level instruments": "أجهزة قياس المستوى"
};

/** Fallback label positions per frame: { label: [x (-1..1), y (-1..1), opacity] }. */
export const VDU_LABELS: ReadonlyArray<Record<string, readonly [number, number, number]>> = [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{"bitumen":[0.7485,0.4255,1]},{"bitumen":[0.545,0.4505,1]},{"lvgo":[-0.9986,-0.9122,0.02],"bitumen":[0.4921,0.4917,0.98]},{"lvgo":[-0.7627,-0.6821,0.35],"hvgo":[-0.2662,-0.8607,0.35],"bitumen":[0.4943,0.6536,0.55]},{"vdo":[-0.8401,-0.1791,0.81],"lvgo":[-0.3334,-0.2064,0.81],"hvgo":[0.197,-0.2351,0.81],"resid":[0.7527,-0.2651,0.81],"bitumen":[0.441,0.9188,0.09]},{"vdo":[-0.5488,0.1319,1],"lvgo":[-0.1009,0.1593,1],"hvgo":[0.3164,0.1847,1],"resid":[0.7061,0.2085,1],"bitumen":[0.2798,0.9498,0.14]},{"vdo":[-0.4022,0.1098,1],"lvgo":[-0.0321,0.1287,1],"hvgo":[0.3165,0.1465,1],"resid":[0.6456,0.1632,1],"bitumen":[0.2805,0.7832,0.34]},{"vdo":[-0.2983,-0.0291,1],"lvgo":[0.0266,-0.0247,1],"hvgo":[0.347,-0.0204,1],"resid":[0.6632,-0.0161,1],"bitumen":[0.3755,0.5974,0.58]},{"vdo":[-0.1498,-0.3302,1],"lvgo":[0.1114,-0.3526,1],"hvgo":[0.3889,-0.3763,1],"resid":[0.6842,-0.4017,1],"bitumen":[0.5482,0.2372,0.8]},{"vdo":[-0.0648,-0.6294,1],"lvgo":[0.1322,-0.6729,1],"hvgo":[0.3504,-0.721,1],"resid":[0.5931,-0.7745,1],"bitumen":[0.6268,-0.1471,0.96]},{"vdo":[-0.0455,-0.7959,0.97],"lvgo":[0.107,-0.8454,0.97],"hvgo":[0.2766,-0.9004,0.97],"resid":[0.4663,-0.9619,0.97],"bitumen":[0.5948,-0.3939,1]},{"vdo":[-0.042,-0.8529,0.42],"lvgo":[0.0881,-0.9017,0.42],"hvgo":[0.2321,-0.9557,0.42],"resid":[0.3924,-1.0158,0.42],"bitumen":[0.5515,-0.4988,1]},{"bitumen":[0.5262,-0.5292,1]},{"bitumen":[0.4874,-0.5289,1],"vac":[-0.0604,1.0359,1]},{"bitumen":[0.4486,-0.4869,1],"vac":[-0.0524,0.9842,1]},{"bitumen":[0.4229,-0.4437,1],"vac":[-0.0487,0.9645,1]},{"bitumen":[0.4118,-0.4284,1],"vac":[-0.0467,0.9511,1]}];
