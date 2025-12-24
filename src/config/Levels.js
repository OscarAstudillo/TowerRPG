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
    for (let t = 0; t <= 1.01; t += 0.01) {
        const x = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * ctrl1X + 3 * (1 - t) * Math.pow(t, 2) * ctrl2X + Math.pow(t, 3) * endX;
        const y = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * ctrl1Y + 3 * (1 - t) * Math.pow(t, 2) * ctrl2Y + Math.pow(t, 3) * endY;
        points.push({ x, y });
    }
    return points;
}

export function getLevelData(biomeKey, levelId) {
    // --- CORRECCIÓN DE RESOLUCIÓN ---
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

    // --- DISEÑO DE NIVELES ---
    
    // Nivel 1: Curva simple central
    if (levelId === 1) {
        paths.push(createCurve(-50, h/2, w+50, h/2, w*0.3, 200, w*0.7, h-200));
        towerSlots.push({x: w*0.2, y: h*0.4}, {x: w*0.4, y: h*0.6}, {x: w*0.6, y: h*0.4}, {x: w*0.8, y: h*0.6}, {x: w*0.5, y: h*0.3});
    }
    // Nivel 2: "S" Invertida grande
    else if (levelId === 2) {
        paths.push(createCurve(-50, 200, w+50, h-200, w*0.5, h, w*0.5, 0));
        towerSlots.push({x: w*0.2, y: 250}, {x: w*0.3, y: 500}, {x: w*0.5, y: 500}, {x: w*0.7, y: 500}, {x: w*0.8, y: 750});
    }
    // Nivel 3-5: 2 Caminos
    else if (levelId >= 3 && levelId <= 5) {
        const offset = (levelId === 4) ? 200 : 0; // Variación para nivel 4
        // Camino Arriba
        paths.push(createCurve(-50, 300, w+50, h/2, w*0.3, 100 + offset, w*0.7, h/2)); 
        // Camino Abajo
        paths.push(createCurve(-50, h-300, w+50, h/2, w*0.3, h-100 - offset, w*0.7, h/2)); 
        
        towerSlots.push(
            {x: w*0.2, y: 200}, {x: w*0.5, y: 200}, {x: w*0.8, y: h/2 - 100},
            {x: w*0.2, y: h-200}, {x: w*0.5, y: h-200}, {x: w*0.8, y: h/2 + 100},
            {x: w*0.4, y: h/2} // Central
        );
    }
    // Nivel 6-8: 3 Caminos
    else if (levelId >= 6 && levelId <= 8) {
        // Arriba, Centro, Abajo
        paths.push(createCurve(-50, 200, w+50, h/2, w*0.4, 200, w*0.7, h/2));
        paths.push(createCurve(-50, h/2, w+50, h/2, w*0.4, h/2, w*0.7, h/2));
        paths.push(createCurve(-50, h-200, w+50, h/2, w*0.4, h-200, w*0.7, h/2));
        
        towerSlots.push(
            {x: w*0.15, y: 150}, {x: w*0.15, y: h/2 - 80}, {x: w*0.15, y: h-150},
            {x: w*0.5, y: 250}, {x: w*0.5, y: h-250},
            {x: w*0.8, y: h/2 - 100}, {x: w*0.8, y: h/2 + 100}
        );
    }
    // Nivel 9-10: 4 Caminos (Caos)
    else {
        for(let i=0; i<4; i++) {
            let sy = 150 + (i * 250);
            let ey = h/2 + ((i-1.5) * 50); // Convergen
            paths.push(createCurve(-50, sy, w+50, ey, w*0.3, sy + (i%2==0?150:-150), w*0.7, ey));
            towerSlots.push({x: w*0.2, y: sy}, {x: w*0.6, y: sy});
        }
        towerSlots.push({x: w*0.8, y: h/2 - 100}, {x: w*0.8, y: h/2 + 100});
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