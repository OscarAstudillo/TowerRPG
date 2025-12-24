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

// Helper para curvas Bezier
function createCurve(startX, startY, endX, endY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y) {
    const points = [];
    for (let t = 0; t <= 1.01; t += 0.005) { // Mayor resolución (0.005) para cálculos más precisos
        const x = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * ctrl1X + 3 * (1 - t) * Math.pow(t, 2) * ctrl2X + Math.pow(t, 3) * endX;
        const y = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * ctrl1Y + 3 * (1 - t) * Math.pow(t, 2) * ctrl2Y + Math.pow(t, 3) * endY;
        points.push({ x, y });
    }
    return points;
}

export function getLevelData(biomeKey, levelId) {
    const w = 1920;
    const h = 1080;
    
    const paths = [];
    const towerSlots = [];
    let pathCount = 1;

    // Regla de caminos progresiva
    if (levelId <= 2) pathCount = 1;
    else if (levelId <= 5) pathCount = 2;
    else if (levelId <= 8) pathCount = 3;
    else pathCount = 4;

    const biomeSeed = biomeKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseSeed = (levelId * 100) + biomeSeed;

    // --- 1. GENERAR CAMINOS ---
    for (let i = 0; i < pathCount; i++) {
        const startY = (h / (pathCount + 1)) * (i + 1);
        const seed = baseSeed + (i * 50);
        const random1 = Math.sin(seed) * 150; 
        const random2 = Math.cos(seed) * 150;

        const p0 = { x: -50, y: startY }; 
        const p1 = { x: w * 0.3, y: startY + random1 }; 
        const p2 = { x: w * 0.7, y: startY - random2 }; 
        const p3 = { x: w + 50, y: h / 2 + (i * 20) }; 

        paths.push(createCurve(p0.x, p0.y, p3.x, p3.y, p1.x, p1.y, p2.x, p2.y));
    }

    // --- 2. GENERAR SLOTS (LÓGICA MEJORADA DE PERPENDICULARIDAD) ---
    // Calculamos la distancia ideal: Radio Camino (30) + Radio Torre (20) + Margen (20) = ~70px
    const placementDist = 75; 
    const maxSlots = 6 + Math.ceil(levelId * 0.8) + (pathCount * 2);
    
    let attempts = 0;
    
    while (towerSlots.length < maxSlots && attempts < 2000) {
        attempts++;
        
        // A. Elegir un camino al azar
        const pathIdx = Math.floor(Math.random() * paths.length);
        const path = paths[pathIdx];
        
        // B. Elegir un punto en el camino (evitando los extremos muy cercanos a bordes)
        // Usamos un margen de seguridad de índices para no salirnos del array
        const pointIdx = Math.floor(Math.random() * (path.length - 40)) + 20;
        const currentPoint = path[pointIdx];
        const nextPoint = path[pointIdx + 5]; // Miramos unos pixeles adelante para ver la dirección

        if (!currentPoint || !nextPoint) continue;

        // C. Calcular el ángulo del camino en este punto
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const pathAngle = Math.atan2(dy, dx);

        // D. Calcular posición PERPENDICULAR (+90 o -90 grados)
        // Esto asegura que la torre esté a un lado, no adelante ni atrás
        const side = (attempts % 2 === 0) ? 1 : -1;
        const anglePerpendicular = pathAngle + (side * Math.PI / 2);

        // E. Proyectar la nueva posición
        const slotX = currentPoint.x + Math.cos(anglePerpendicular) * placementDist;
        const slotY = currentPoint.y + Math.sin(anglePerpendicular) * placementDist;

        // F. Validaciones
        
        // 1. Dentro de pantalla (con margen)
        if (slotX < 50 || slotX > w - 50 || slotY < 100 || slotY > h - 100) continue;

        // 2. Distancia con otros slots (No encimarse)
        const overlapSlot = towerSlots.some(s => Math.hypot(s.x - slotX, s.y - slotY) < 70);
        if (overlapSlot) continue;

        // 3. Distancia con CUALQUIER camino (Crucial para no quedar en medio de una curva cerrada u otro camino)
        let overlapPath = false;
        // Revisamos todos los caminos para asegurarnos que no caemos encima de ninguno
        for (let p = 0; p < paths.length; p++) {
            for (let k = 0; k < paths[p].length; k += 10) { // Salto de 10 para rendimiento
                if (Math.hypot(paths[p][k].x - slotX, paths[p][k].y - slotY) < 55) {
                    overlapPath = true;
                    break;
                }
            }
            if (overlapPath) break;
        }
        if (overlapPath) continue;

        // Si pasa todas las pruebas, agregamos el slot
        towerSlots.push({ x: slotX, y: slotY });
    }

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