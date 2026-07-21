// src/features/teams/tactics/types.ts

export type Position =
  | "GK" | "CB" | "LB" | "RB" | "LWB" | "RWB"
  | "DMF" | "CMF" | "AMF" | "LMF" | "RMF"
  | "LWF" | "RWF" | "CF" | "SS";

export interface Player {
  id: string;
  name: string;
  rating: number;
  position: Position;
  squadNumber: number;
  photo?: string;
}

export type FormationType =
  | "4-2-3-1" | "4-4-2" | "4-3-3" | "4-3-2-1" | "4-3-1-2"
  | "4-2-1-3" | "4-1-4-1" | "4-1-2-3" | "3-4-3" | "3-2-4-1"
  | "3-2-3-2" | "3-1-4-2" | "5-3-2" | "5-2-2-1" | "5-2-1-2";

export interface TacticalSlot {
  id: string;
  role: Position;
  top: number; // % from top of pitch (0 = attacking goal, 100 = own goal)
  left: number; // % from left
}

export interface SavedFormation {
  id: string;
  label: string;
  formationType: FormationType;
  squad: Record<string, string>;
}

// Coordinates: own goal (GK) at the bottom, attacking third at the top.
export const FORMATION_PRESETS: Record<FormationType, TacticalSlot[]> = {
  "4-2-3-1": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lb", role: "LB", top: 68, left: 15 },
    { id: "cb1", role: "CB", top: 70, left: 38 },
    { id: "cb2", role: "CB", top: 70, left: 62 },
    { id: "rb", role: "RB", top: 68, left: 85 },
    { id: "dmf1", role: "DMF", top: 51, left: 35 },
    { id: "dmf2", role: "DMF", top: 51, left: 65 },
    { id: "lmf", role: "LMF", top: 34, left: 18 },
    { id: "amf", role: "AMF", top: 32, left: 50 },
    { id: "rmf", role: "RMF", top: 34, left: 82 },
    { id: "cf", role: "CF", top: 14, left: 50 },
  ],
  "4-4-2": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lb", role: "LB", top: 68, left: 15 },
    { id: "cb1", role: "CB", top: 70, left: 38 },
    { id: "cb2", role: "CB", top: 70, left: 62 },
    { id: "rb", role: "RB", top: 68, left: 85 },
    { id: "lmf", role: "LMF", top: 44, left: 15 },
    { id: "cmf1", role: "CMF", top: 48, left: 38 },
    { id: "cmf2", role: "CMF", top: 48, left: 62 },
    { id: "rmf", role: "RMF", top: 44, left: 85 },
    { id: "cf1", role: "CF", top: 16, left: 38 },
    { id: "cf2", role: "CF", top: 16, left: 62 },
  ],
  "4-3-3": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lb", role: "LB", top: 68, left: 15 },
    { id: "cb1", role: "CB", top: 70, left: 38 },
    { id: "cb2", role: "CB", top: 70, left: 62 },
    { id: "rb", role: "RB", top: 68, left: 85 },
    { id: "dmf", role: "DMF", top: 51, left: 50 },
    { id: "cmf1", role: "CMF", top: 44, left: 26 },
    { id: "cmf2", role: "CMF", top: 44, left: 74 },
    { id: "lwf", role: "LWF", top: 16, left: 18 },
    { id: "rwf", role: "RWF", top: 16, left: 82 },
    { id: "cf", role: "CF", top: 12, left: 50 },
  ],
  "4-3-2-1": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lb", role: "LB", top: 68, left: 15 },
    { id: "cb1", role: "CB", top: 70, left: 38 },
    { id: "cb2", role: "CB", top: 70, left: 62 },
    { id: "rb", role: "RB", top: 68, left: 85 },
    { id: "cmf1", role: "CMF", top: 48, left: 25 },
    { id: "dmf", role: "DMF", top: 51, left: 50 },
    { id: "cmf2", role: "CMF", top: 48, left: 75 },
    { id: "amf1", role: "AMF", top: 30, left: 35 },
    { id: "amf2", role: "AMF", top: 30, left: 65 },
    { id: "cf", role: "CF", top: 12, left: 50 },
  ],
  "4-3-1-2": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lb", role: "LB", top: 68, left: 15 },
    { id: "cb1", role: "CB", top: 70, left: 38 },
    { id: "cb2", role: "CB", top: 70, left: 62 },
    { id: "rb", role: "RB", top: 68, left: 85 },
    { id: "cmf1", role: "CMF", top: 48, left: 25 },
    { id: "dmf", role: "DMF", top: 51, left: 50 },
    { id: "cmf2", role: "CMF", top: 48, left: 75 },
    { id: "amf", role: "AMF", top: 32, left: 50 },
    { id: "cf1", role: "CF", top: 14, left: 38 },
    { id: "cf2", role: "CF", top: 14, left: 62 },
  ],
  "4-2-1-3": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lb", role: "LB", top: 68, left: 15 },
    { id: "cb1", role: "CB", top: 70, left: 38 },
    { id: "cb2", role: "CB", top: 70, left: 62 },
    { id: "rb", role: "RB", top: 68, left: 85 },
    { id: "dmf1", role: "DMF", top: 51, left: 35 },
    { id: "dmf2", role: "DMF", top: 51, left: 65 },
    { id: "amf", role: "AMF", top: 32, left: 50 },
    { id: "lwf", role: "LWF", top: 16, left: 18 },
    { id: "rwf", role: "RWF", top: 16, left: 82 },
    { id: "cf", role: "CF", top: 12, left: 50 },
  ],
  "4-1-4-1": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lb", role: "LB", top: 68, left: 15 },
    { id: "cb1", role: "CB", top: 70, left: 38 },
    { id: "cb2", role: "CB", top: 70, left: 62 },
    { id: "rb", role: "RB", top: 68, left: 85 },
    { id: "dmf", role: "DMF", top: 51, left: 50 },
    { id: "lmf", role: "LMF", top: 30, left: 15 },
    { id: "cmf1", role: "CMF", top: 32, left: 38 },
    { id: "cmf2", role: "CMF", top: 32, left: 62 },
    { id: "rmf", role: "RMF", top: 30, left: 85 },
    { id: "cf", role: "CF", top: 14, left: 50 },
  ],
  "4-1-2-3": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lb", role: "LB", top: 68, left: 15 },
    { id: "cb1", role: "CB", top: 70, left: 38 },
    { id: "cb2", role: "CB", top: 70, left: 62 },
    { id: "rb", role: "RB", top: 68, left: 85 },
    { id: "dmf", role: "DMF", top: 51, left: 50 },
    { id: "cmf1", role: "CMF", top: 34, left: 33 },
    { id: "cmf2", role: "CMF", top: 34, left: 67 },
    { id: "lwf", role: "LWF", top: 16, left: 18 },
    { id: "rwf", role: "RWF", top: 16, left: 82 },
    { id: "cf", role: "CF", top: 12, left: 50 },
  ],
  "3-4-3": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "cb1", role: "CB", top: 68, left: 25 },
    { id: "cb2", role: "CB", top: 70, left: 50 },
    { id: "cb3", role: "CB", top: 68, left: 75 },
    { id: "lmf", role: "LMF", top: 48, left: 15 },
    { id: "cmf1", role: "CMF", top: 50, left: 38 },
    { id: "cmf2", role: "CMF", top: 50, left: 62 },
    { id: "rmf", role: "RMF", top: 48, left: 85 },
    { id: "lwf", role: "LWF", top: 18, left: 20 },
    { id: "rwf", role: "RWF", top: 18, left: 80 },
    { id: "cf", role: "CF", top: 12, left: 50 },
  ],
  "3-2-4-1": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "cb1", role: "CB", top: 68, left: 25 },
    { id: "cb2", role: "CB", top: 70, left: 50 },
    { id: "cb3", role: "CB", top: 68, left: 75 },
    { id: "dmf1", role: "DMF", top: 51, left: 35 },
    { id: "dmf2", role: "DMF", top: 51, left: 65 },
    { id: "lmf", role: "LMF", top: 32, left: 15 },
    { id: "amf1", role: "AMF", top: 34, left: 38 },
    { id: "amf2", role: "AMF", top: 34, left: 62 },
    { id: "rmf", role: "RMF", top: 32, left: 85 },
    { id: "cf", role: "CF", top: 14, left: 50 },
  ],
  "3-2-3-2": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "cb1", role: "CB", top: 68, left: 25 },
    { id: "cb2", role: "CB", top: 70, left: 50 },
    { id: "cb3", role: "CB", top: 68, left: 75 },
    { id: "dmf1", role: "DMF", top: 51, left: 35 },
    { id: "dmf2", role: "DMF", top: 51, left: 65 },
    { id: "lmf", role: "LMF", top: 32, left: 15 },
    { id: "amf", role: "AMF", top: 34, left: 50 },
    { id: "rmf", role: "RMF", top: 32, left: 85 },
    { id: "cf1", role: "CF", top: 14, left: 38 },
    { id: "cf2", role: "CF", top: 14, left: 62 },
  ],
  "3-1-4-2": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "cb1", role: "CB", top: 68, left: 25 },
    { id: "cb2", role: "CB", top: 70, left: 50 },
    { id: "cb3", role: "CB", top: 68, left: 75 },
    { id: "dmf", role: "DMF", top: 51, left: 50 },
    { id: "lmf", role: "LMF", top: 32, left: 15 },
    { id: "cmf1", role: "CMF", top: 34, left: 38 },
    { id: "cmf2", role: "CMF", top: 34, left: 62 },
    { id: "rmf", role: "RMF", top: 32, left: 85 },
    { id: "cf1", role: "CF", top: 14, left: 38 },
    { id: "cf2", role: "CF", top: 14, left: 62 },
  ],
  "5-3-2": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lwb", role: "LWB", top: 62, left: 12 },
    { id: "cb1", role: "CB", top: 68, left: 30 },
    { id: "cb2", role: "CB", top: 70, left: 50 },
    { id: "cb3", role: "CB", top: 68, left: 70 },
    { id: "rwb", role: "RWB", top: 62, left: 88 },
    { id: "cmf1", role: "CMF", top: 44, left: 28 },
    { id: "dmf", role: "DMF", top: 46, left: 50 },
    { id: "cmf2", role: "CMF", top: 44, left: 72 },
    { id: "cf1", role: "CF", top: 16, left: 38 },
    { id: "cf2", role: "CF", top: 16, left: 62 },
  ],
  "5-2-2-1": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lwb", role: "LWB", top: 62, left: 12 },
    { id: "cb1", role: "CB", top: 68, left: 30 },
    { id: "cb2", role: "CB", top: 70, left: 50 },
    { id: "cb3", role: "CB", top: 68, left: 70 },
    { id: "rwb", role: "RWB", top: 62, left: 88 },
    { id: "cmf1", role: "CMF", top: 50, left: 35 },
    { id: "cmf2", role: "CMF", top: 50, left: 65 },
    { id: "amf1", role: "AMF", top: 32, left: 33 },
    { id: "amf2", role: "AMF", top: 32, left: 67 },
    { id: "cf", role: "CF", top: 14, left: 50 },
  ],
  "5-2-1-2": [
    { id: "gk", role: "GK", top: 88, left: 50 },
    { id: "lwb", role: "LWB", top: 62, left: 12 },
    { id: "cb1", role: "CB", top: 68, left: 30 },
    { id: "cb2", role: "CB", top: 70, left: 50 },
    { id: "cb3", role: "CB", top: 68, left: 70 },
    { id: "rwb", role: "RWB", top: 62, left: 88 },
    { id: "cmf1", role: "CMF", top: 50, left: 35 },
    { id: "cmf2", role: "CMF", top: 50, left: 65 },
    { id: "amf", role: "AMF", top: 32, left: 50 },
    { id: "cf1", role: "CF", top: 14, left: 38 },
    { id: "cf2", role: "CF", top: 14, left: 62 },
  ],
};

// Broad category grouping used for aptitude scoring when a player is
// placed outside their natural position.
export const ROLE_MAP: Record<string, Position[]> = {
  GK: ["GK"],
  DEF: ["CB", "RB", "LB", "RWB", "LWB"],
  MID: ["DMF", "CMF", "AMF", "RMF", "LMF"],
  FWD: ["CF", "SS", "RWF", "LWF"],
};

export const getAptitudeMultiplier = (playerPos: Position, slotRole: Position): number => {
  if (playerPos === slotRole) return 1.0;
  const playerCat = Object.keys(ROLE_MAP).find((cat) => ROLE_MAP[cat].includes(playerPos));
  const slotCat = Object.keys(ROLE_MAP).find((cat) => ROLE_MAP[cat].includes(slotRole));
  if (playerCat === slotCat) return 0.9;
  return 0.5;
};

export const autopickSquad = (formation: FormationType, players: Player[]): Record<string, string> => {
  const slots = FORMATION_PRESETS[formation];
  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);
  const selectedIds = new Set<string>();
  const newSquad: Record<string, string> = {};

  slots.forEach((slot) => {
    let bestMatch = sortedPlayers.find((p) => !selectedIds.has(p.id) && p.position === slot.role);

    if (!bestMatch) {
      const slotCat = Object.keys(ROLE_MAP).find((cat) => ROLE_MAP[cat].includes(slot.role));
      bestMatch = sortedPlayers.find(
        (p) =>
          !selectedIds.has(p.id) &&
          Object.keys(ROLE_MAP).find((cat) => ROLE_MAP[cat].includes(p.position)) === slotCat,
      );
    }

    if (!bestMatch) {
      bestMatch = sortedPlayers.find((p) => !selectedIds.has(p.id));
    }

    if (bestMatch) {
      newSquad[slot.id] = bestMatch.id;
      selectedIds.add(bestMatch.id);
    }
  });

  return newSquad;
};