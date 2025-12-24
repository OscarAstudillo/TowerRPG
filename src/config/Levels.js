// src/config/Levels.js

export const BIOMES = {
    forest: { 
        name: "Bosque Ancestral", 
        desc: "Madera y Pieles abundantes.", 
        theme: { bg: 0x0d3b14, path: 0x2e8b57, accent: 0x00ff00, grid: 0x114422 },
        materials: { 1: ['wood', 'hide', 'scraps'], 2: ['cedar', 'leather', 'cotton'], 3: ['ebony', 'scale', 'silk'] }
    },
    mountain: { 
        name: "Montaña Rocosa", 
        desc: "Minerales y Piedra.", 
        theme: { bg: 0x2b2b2b, path: 0x505050, accent: 0x00ffff, grid: 0x333333 },
        materials: { 1: ['copper', 'coal'], 2: ['iron', 'coal'], 3: ['mithril', 'iron'] }
    },
    volcano: { 
        name: "Volcán Activo", 
        desc: "Calor extremo.", 
        theme: { bg: 0x220505, path: 0x5c0a0a, accent: 0xff4500, grid: 0x441111 },
        materials: { 1: ['copper', 'coal'], 2: ['iron', 'coal'], 3: ['mithril', 'iron'] }
    }
};

export const LEVEL_CONFIG = {
    1: { waves: 3, hpMult: 1.0, dropRate: 0.15, tier: 1 },
    2: { waves: 4, hpMult: 1.2, dropRate: 0.18, tier: 1 },
    3: { waves: 5, hpMult: 1.5, dropRate: 0.20, tier: 1 },
    4: { waves: 6, hpMult: 2.0, dropRate: 0.22, tier: 2 },
    5: { waves: 7, hpMult: 2.5, dropRate: 0.25, tier: 2 },
    6: { waves: 8, hpMult: 3.0, dropRate: 0.28, tier: 2 },
    7: { waves: 9, hpMult: 4.0, dropRate: 0.30, tier: 2 },
    8: { waves: 10, hpMult: 5.5, dropRate: 0.35, tier: 3 },
    9: { waves: 12, hpMult: 7.0, dropRate: 0.40, tier: 3 },
    10: { waves: 15, hpMult: 10.0, dropRate: 0.50, tier: 3 }
};

// --- DEFINICIONES MANUALES DE LOS 30 NIVELES ---
// Formato: { [biome_level]: [ { p0, p1, p2, p3 }, ... ] }
// p0: Inicio, p1: Control1, p2: Control2, p3: Final
const MAP_LAYOUTS = {
    // --- BOSQUE (Curvas suaves y orgánicas) ---
    'forest_1': [ { p0:[0,540], p1:[600,200], p2:[1200,800], p3:[1920,540] } ], // 1 Ruta
    'forest_2': [ { p0:[0,200], p1:[800,200], p2:[1000,900], p3:[1920,900] } ], // 1 Ruta (Bajada larga)
    
    'forest_3': [ // 2 Rutas
        { p0:[0,300], p1:[500,100], p2:[1400,100], p3:[1920,400] },
        { p0:[0,800], p1:[500,1000], p2:[1400,1000], p3:[1920,700] }
    ],
    'forest_4': [ // 2 Rutas (Cruce)
        { p0:[0,200], p1:[960,200], p2:[960,900], p3:[1920,900] },
        { p0:[0,900], p1:[960,900], p2:[960,200], p3:[1920,200] }
    ],
    'forest_5': [ // 2 Rutas (Onduladas)
        { p0:[0,400], p1:[600,100], p2:[1200,700], p3:[1920,400] },
        { p0:[0,600], p1:[600,900], p2:[1200,300], p3:[1920,600] }
    ],

    'forest_6': [ // 3 Rutas
        { p0:[0,200], p1:[600,200], p2:[1200,200], p3:[1920,540] },
        { p0:[0,540], p1:[600,540], p2:[1200,540], p3:[1920,540] },
        { p0:[0,900], p1:[600,900], p2:[1200,900], p3:[1920,540] }
    ],
    'forest_7': [ // 3 Rutas (Separadas)
        { p0:[0,150], p1:[800,150], p2:[1200,150], p3:[1920,150] },
        { p0:[0,540], p1:[800,540], p2:[1200,540], p3:[1920,540] },
        { p0:[0,930], p1:[800,930], p2:[1200,930], p3:[1920,930] }
    ],
    'forest_8': [ // 3 Rutas (S complejas)
        { p0:[0,200], p1:[500,800], p2:[1400,200], p3:[1920,800] },
        { p0:[0,540], p1:[600,540], p2:[1300,540], p3:[1920,540] },
        { p0:[0,900], p1:[500,300], p2:[1400,900], p3:[1920,300] }
    ],

    'forest_9': [ // 4 Rutas
        { p0:[0,150], p1:[500,150], p2:[1000,500], p3:[1920,500] },
        { p0:[0,350], p1:[500,350], p2:[1000,500], p3:[1920,500] },
        { p0:[0,750], p1:[500,750], p2:[1000,580], p3:[1920,580] },
        { p0:[0,950], p1:[500,950], p2:[1000,580], p3:[1920,580] }
    ],
    'forest_10': [ // 4 Rutas (Final Boss)
        { p0:[0,100], p1:[960,100], p2:[1200,540], p3:[1920,540] },
        { p0:[0,300], p1:[700,300], p2:[1100,540], p3:[1920,540] },
        { p0:[0,700], p1:[700,700], p2:[1100,540], p3:[1920,540] },
        { p0:[0,980], p1:[960,980], p2:[1200,540], p3:[1920,540] }
    ],

    // --- MONTAÑA (Caminos más angulares/rectos simulados con Bezier) ---
    'mountain_1': [ { p0:[0,200], p1:[500,200], p2:[500,800], p3:[1920,800] } ],
    'mountain_2': [ { p0:[0,800], p1:[400,800], p2:[1200,200], p3:[1920,200] } ],

    'mountain_3': [
        { p0:[0,200], p1:[960,200], p2:[960,200], p3:[1920,200] },
        { p0:[0,800], p1:[960,800], p2:[960,800], p3:[1920,800] }
    ],
    'mountain_4': [
        { p0:[0,300], p1:[600,300], p2:[600,600], p3:[1920,600] },
        { p0:[0,800], p1:[1200,800], p2:[1200,600], p3:[1920,600] }
    ],
    'mountain_5': [
        { p0:[0,100], p1:[1920,1000], p2:[1920,1000], p3:[1920,1000] }, // Diagonal pura
        { p0:[0,1000], p1:[1920,100], p2:[1920,100], p3:[1920,100] }    // Diagonal pura
    ],

    'mountain_6': [
        { p0:[0,200], p1:[960,540], p2:[1500,540], p3:[1920,540] },
        { p0:[0,540], p1:[960,540], p2:[1500,540], p3:[1920,540] },
        { p0:[0,900], p1:[960,540], p2:[1500,540], p3:[1920,540] }
    ],
    'mountain_7': [
        { p0:[0,150], p1:[600,150], p2:[600,400], p3:[1920,400] },
        { p0:[0,540], p1:[1000,540], p2:[1000,540], p3:[1920,540] },
        { p0:[0,950], p1:[600,950], p2:[600,700], p3:[1920,700] }
    ],
    'mountain_8': [
        { p0:[0,200], p1:[400,200], p2:[400,900], p3:[1920,900] },
        { p0:[0,540], p1:[900,540], p2:[1200,540], p3:[1920,540] },
        { p0:[0,900], p1:[1400,900], p2:[1400,200], p3:[1920,200] }
    ],

    'mountain_9': [
        { p0:[0,100], p1:[1920,100], p2:[1920,100], p3:[1920,100] },
        { p0:[0,350], p1:[1920,350], p2:[1920,350], p3:[1920,350] },
        { p0:[0,650], p1:[1920,650], p2:[1920,650], p3:[1920,650] },
        { p0:[0,900], p1:[1920,900], p2:[1920,900], p3:[1920,900] }
    ],
    'mountain_10': [
        { p0:[0,200], p1:[500,540], p2:[1000,540], p3:[1920,540] },
        { p0:[0,400], p1:[500,540], p2:[1000,540], p3:[1920,540] },
        { p0:[0,700], p1:[500,540], p2:[1000,540], p3:[1920,540] },
        { p0:[0,900], p1:[500,540], p2:[1000,540], p3:[1920,540] }
    ],

    // --- VOLCÁN (Caóticos y Convergentes) ---
    'volcano_1': [ { p0:[0,540], p1:[400,200], p2:[1500,900], p3:[1920,540] } ],
    'volcano_2': [ { p0:[0,100], p1:[960,1080], p2:[1500,0], p3:[1920,540] } ],

    'volcano_3': [
        { p0:[0,300], p1:[800,300], p2:[1200,540], p3:[1920,540] },
        { p0:[0,800], p1:[800,800], p2:[1200,540], p3:[1920,540] }
    ],
    'volcano_4': [
        { p0:[0,200], p1:[500,200], p2:[1400,900], p3:[1920,900] },
        { p0:[0,900], p1:[500,900], p2:[1400,200], p3:[1920,200] }
    ],
    'volcano_5': [
        { p0:[0,540], p1:[600,100], p2:[1200,100], p3:[1920,540] },
        { p0:[0,540], p1:[600,1000], p2:[1200,1000], p3:[1920,540] }
    ],

    'volcano_6': [
        { p0:[0,100], p1:[600,100], p2:[1200,540], p3:[1920,540] },
        { p0:[0,540], p1:[600,540], p2:[1200,540], p3:[1920,540] },
        { p0:[0,1000], p1:[600,1000], p2:[1200,540], p3:[1920,540] }
    ],
    'volcano_7': [
        { p0:[0,200], p1:[1920,200], p2:[1920,200], p3:[1920,200] },
        { p0:[0,540], p1:[960,200], p2:[1500,800], p3:[1920,540] }, // Curva rara
        { p0:[0,900], p1:[1920,900], p2:[1920,900], p3:[1920,900] }
    ],
    'volcano_8': [
        { p0:[0,150], p1:[500,540], p2:[1000,150], p3:[1920,150] },
        { p0:[0,540], p1:[500,150], p2:[1000,900], p3:[1920,540] },
        { p0:[0,950], p1:[500,540], p2:[1000,950], p3:[1920,950] }
    ],

    'volcano_9': [
        { p0:[0,150], p1:[960,540], p2:[1200,540], p3:[1920,540] },
        { p0:[0,400], p1:[960,540], p2:[1200,540], p3:[1920,540] },
        { p0:[0,700], p1:[960,540], p2:[1200,540], p3:[1920,540] },
        { p0:[0,950], p1:[960,540], p2:[1200,540], p3:[1920,540] }
    ],
    'volcano_10': [
        { p0:[0,100], p1:[1920,100], p2:[1920,100], p3:[1920,100] },
        { p0:[0,350], p1:[1920,350], p2:[1920,350], p3:[1920,350] },
        { p0:[0,650], p1:[1920,650], p2:[1920,650], p3:[1920,650] },
        { p0:[0,900], p1:[1920,900], p2:[1920,900], p3:[1920,900] }
    ]
};

// Generador de puntos (Interpolación Bezier)
function getBezierPoints(p0, p1, p2, p3) {
    const points = [];
    for (let t = 0; t <= 1.01; t += 0.005) { // Alta resolución
        const x = Math.pow(1 - t, 3) * p0[0] + 3 * Math.pow(1 - t, 2) * t * p1[0] + 3 * (1 - t) * Math.pow(t, 2) * p2[0] + Math.pow(t, 3) * p3[0];
        const y = Math.pow(1 - t, 3) * p0[1] + 3 * Math.pow(1 - t, 2) * t * p1[1] + 3 * (1 - t) * Math.pow(t, 2) * p2[1] + Math.pow(t, 3) * p3[1];
        points.push({ x, y });
    }
    return points;
}

export function getLevelData(biomeKey, levelId) {
    // 1. Obtener definición manual
    const mapKey = `${biomeKey}_${levelId}`;
    const layout = MAP_LAYOUTS[mapKey] || MAP_LAYOUTS['forest_1']; // Fallback
    
    // 2. Generar caminos (puntos)
    const paths = layout.map(def => getBezierPoints(def.p0, def.p1, def.p2, def.p3));
    const pathCount = paths.length;

    // 3. Generar Slots Automáticamente (Perpendiculares al camino)
    const towerSlots = [];
    const width = 1920; 
    const height = 1080;
    // Más slots según nivel: Nivel 1 = ~6 slots, Nivel 10 = ~16 slots
    const maxSlots = 6 + levelId; 
    const placeDist = 80; // Distancia desde el centro del camino

    let attempts = 0;
    while(towerSlots.length < maxSlots && attempts < 2000) {
        attempts++;
        // Elegir camino random
        const pIdx = Math.floor(Math.random() * paths.length);
        const path = paths[pIdx];
        // Elegir punto random (evitando extremos)
        const ptIdx = Math.floor(Math.random() * (path.length - 40)) + 20;
        
        const curr = path[ptIdx];
        const next = path[ptIdx + 5]; // Para calcular ángulo
        
        // Ángulo del camino
        const angle = Math.atan2(next.y - curr.y, next.x - curr.x);
        
        // Lado aleatorio (+90 o -90 grados)
        const side = (attempts % 2 === 0) ? 1 : -1;
        const perpAngle = angle + (side * Math.PI / 2);
        
        const slotX = curr.x + Math.cos(perpAngle) * placeDist;
        const slotY = curr.y + Math.sin(perpAngle) * placeDist;

        // Validaciones
        if (slotX < 50 || slotX > width - 50 || slotY < 80 || slotY > height - 80) continue;
        
        // No encimarse a otros slots
        const overlapSlot = towerSlots.some(s => Math.hypot(s.x - slotX, s.y - slotY) < 80);
        if (overlapSlot) continue;

        // No caer en OTRO camino (Importante para cruces)
        let overlapPath = false;
        paths.forEach(p => {
            for(let k=0; k<p.length; k+=10) {
                if (Math.hypot(p[k].x - slotX, p[k].y - slotY) < 60) {
                    overlapPath = true; 
                    break;
                }
            }
        });
        if (overlapPath) continue;

        towerSlots.push({ x: slotX, y: slotY });
    }

    // 4. Spawn Multiplier
    const spawnMultiplier = 1 + ((pathCount - 1) * 0.5);

    return {
        id: levelId,
        name: `${BIOMES[biomeKey].name} - Nivel ${levelId}`,
        paths: paths,
        towerSlots: towerSlots,
        spawnMultiplier: spawnMultiplier,
        pathCount: pathCount
    };
}