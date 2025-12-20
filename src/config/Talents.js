// src/config/Talents.js

// Helper para crear talentos rápido
const t = (id, tier, name, desc, stats = {}, effect = null, val = 0) => ({ 
    id, tier, name, desc, stats, effect, val 
});

export const TALENTS = {
    paladin: [
        // Nivel 10
        t('pal_10_a', 10, 'Fe Inquebrantable', '+20% Vida Máxima', { maxHpMult: 0.2 }),
        t('pal_10_b', 10, 'Martillo Justo', '+15% Daño', { damageMult: 0.15 }),
        // Nivel 20
        t('pal_20_a', 20, 'Escudo Divino', '10% Chance de Bloqueo', {}, 'block_chance', 10),
        t('pal_20_b', 20, 'Regeneración Sacra', '+10 Regen HP', { regenHp: 10 }),
        // Nivel 30
        t('pal_30_a', 30, 'Armadura de Placas', '+5 Defensa', { defense: 5 }),
        t('pal_30_b', 30, 'Venganza', '+50% Daño Espinas', { thorns: 10 }), // Simulamos boost espinas
        // Nivel 40 a 100 (Patrones)
        t('pal_40_a', 40, 'Vitalidad I', '+300 HP', { maxHp: 300 }),
        t('pal_40_b', 40, 'Fuerza I', '+20 Daño', { damage: 20 }),
        t('pal_50_a', 50, 'Muro de Hierro', '+15% Bloqueo', {}, 'block_chance', 15),
        t('pal_50_b', 50, 'Aura Curativa', '+20 Regen HP', { regenHp: 20 }),
        t('pal_60_a', 60, 'Piel de Diamante', '+8 Defensa', { defense: 8 }),
        t('pal_60_b', 60, 'Castigo Divino', '+30% Daño Crítico', { critDamage: 30 }),
        t('pal_70_a', 70, 'Vitalidad II', '+500 HP', { maxHp: 500 }),
        t('pal_70_b', 70, 'Fuerza II', '+40 Daño', { damage: 40 }),
        t('pal_80_a', 80, 'Bastión', '+20% Bloqueo', {}, 'block_chance', 20),
        t('pal_80_b', 80, 'Luz Eterna', '+50 Regen HP', { regenHp: 50 }),
        t('pal_90_a', 90, 'Tanque Supremo', '+30% Vida', { maxHpMult: 0.3 }),
        t('pal_90_b', 90, 'Cruzado', '+30% Daño', { damageMult: 0.3 }),
        t('pal_100_a', 100, 'INMORTAL', '+20 Defensa y +1000 HP', { defense: 20, maxHp: 1000 }),
        t('pal_100_b', 100, 'DIOS DE LA GUERRA', '+100 Daño y +100% Crítico', { damage: 100, critChance: 100 })
    ],
    guerrero: [
        // Nivel 10
        t('war_10_a', 10, 'Sed de Sangre', '+5% Robo de Vida', { lifesteal: 5 }),
        t('war_10_b', 10, 'Golpe Brutal', '+20% Daño', { damageMult: 0.2 }),
        // Nivel 20
        t('war_20_a', 20, 'Doble Filo', '10% Chance Doble Ataque', {}, 'double_strike', 10),
        t('war_20_b', 20, 'Piel Dura', '+5 Defensa', { defense: 5 }),
        // Nivel 30... (Genéricos para completar)
        t('war_30_a', 30, 'Frenesí', '+100 Vel. Ataque', { attackSpeed: 100 }),
        t('war_30_b', 30, 'Crítico', '+10% Chance Crítico', { critChance: 10 }),
        t('war_40_a', 40, 'Maestría I', '+30 Daño', { damage: 30 }),
        t('war_40_b', 40, 'Aguante I', '+400 HP', { maxHp: 400 }),
        t('war_50_a', 50, 'Torbellino', '15% Chance Doble Ataque', {}, 'double_strike', 15),
        t('war_50_b', 50, 'Vampirismo', '+5% Robo Vida', { lifesteal: 5 }),
        t('war_60_a', 60, 'Ira', '+200 Vel. Ataque', { attackSpeed: 200 }),
        t('war_60_b', 60, 'Precisión', '+15% Chance Crítico', { critChance: 15 }),
        t('war_70_a', 70, 'Maestría II', '+60 Daño', { damage: 60 }),
        t('war_70_b', 70, 'Aguante II', '+800 HP', { maxHp: 800 }),
        t('war_80_a', 80, 'Masacre', '20% Chance Doble Ataque', {}, 'double_strike', 20),
        t('war_80_b', 80, 'Inmortal', '+10% Robo Vida', { lifesteal: 10 }),
        t('war_90_a', 90, 'Berserker', '+40% Daño', { damageMult: 0.4 }),
        t('war_90_b', 90, 'Coloso', '+40% Vida', { maxHpMult: 0.4 }),
        t('war_100_a', 100, 'SEÑOR DE LA GUERRA', '+200 Daño', { damage: 200 }),
        t('war_100_b', 100, 'INDESTRUCTIBLE', '+5000 HP', { maxHp: 5000 })
    ],
    // (Puedes replicar la estructura para Arquero, Mago y Asesino siguiendo el patrón)
    arquero: [
        t('arc_10_a', 10, 'Ojo de Halcón', '+20% Rango', { rangeMult: 0.2 }),
        t('arc_10_b', 10, 'Flechas Ligeras', '+150 Vel. Ataque', { attackSpeed: 150 }),
        t('arc_20_a', 20, 'Punta Perforante', 'Ignora Defensas (Pierce)', {}, 'pierce', 1),
        t('arc_20_b', 20, 'Cazador', '+10% Crítico', { critChance: 10 }),
        // ... (Rellena hasta 100 si quieres, o el código lo manejará si faltan, pero mejor tenerlos)
        // Por brevedad del ejemplo, asumimos que existen o que el bucle no crashea si faltan
        t('arc_30_a', 30, 'Tiro Certero', '+20 Daño', { damage: 20 }),
        t('arc_30_b', 30, 'Agilidad', '+10% Evasión (Def)', { defense: 5 }),
        // ... (Repetir patrón de aumento de stats)
        t('arc_100_a', 100, 'LEGOLAS', '+500% Rango', { rangeMult: 5.0 }),
        t('arc_100_b', 100, 'AMETRALLADORA', '+1000 Vel. Ataque', { attackSpeed: 1000 })
    ],
    mago: [
        t('mag_10_a', 10, 'Sabiduría', '+20% Daño Hechizo', { skillDamage: 20 }),
        t('mag_10_b', 10, 'Concentración', '-10% Cooldown', { cdr: 10 }),
        t('mag_20_a', 20, 'Escarcha', 'Ataques ralentizan', {}, 'frost_hit', 30),
        t('mag_20_b', 20, 'Bola de Fuego', '+20 Daño Base', { damage: 20 }),
        // ...
        t('mag_100_a', 100, 'ARCHIMAGO', '+500% Daño Skill', { skillDamage: 500 }),
        t('mag_100_b', 100, 'TIEMPO CERO', '-50% Cooldown', { cdr: 50 })
    ],
    asesino: [
        t('asn_10_a', 10, 'Sombra', '+20% Movimiento', { moveSpeedMult: 0.2 }),
        t('asn_10_b', 10, 'Daga Venenosa', '+15% Daño', { damageMult: 0.15 }),
        t('asn_20_a', 20, 'Punto Débil', '+50% Daño Crítico', { critDamage: 50 }),
        t('asn_20_b', 20, 'Reflejos', '10% Chance Doble Ataque', {}, 'double_strike', 10),
        // ...
        t('asn_100_a', 100, 'MUERTE SILENCIOSA', '+1000% Daño Crítico', { critDamage: 1000 }),
        t('asn_100_b', 100, 'NINJA', '100% Doble Ataque', {}, 'double_strike', 100 )
    ]
};