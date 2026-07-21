// src/features/teams/tactics/ManageTeamView.tsx
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { ArrowLeft, ArrowLeftRight, Sparkles, X, Palette } from "lucide-react";
import { Player, FormationType, FORMATION_PRESETS, SavedFormation, autopickSquad, getAptitudeMultiplier } from "./types";
import { TacticalCard } from "./TacticalCard";
import { Avatar } from "../../../components/ui";
import { PlayerPlaceholder } from "../../../components/ui/PlayerPlaceholder";
import mannequinPng from "../../../assets/players/mannequin.png";

interface ManageTeamViewProps {
  teamName: string;
  players: Player[];
  coach?: { firstName: string; lastName: string } | null;
  primaryColor: string;
  secondaryColor: string;
  onBack: () => void;
  onEditColors: () => void;
}

export const ManageTeamView: React.FC<ManageTeamViewProps> = ({
  teamName,
  players,
  coach,
  primaryColor,
  secondaryColor,
  onBack,
  onEditColors,
}) => {
  const [formation, setFormation] = useState<FormationType>("4-2-3-1");
  const [squad, setSquad] = useState<Record<string, string>>(() => autopickSquad("4-2-3-1", players));
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [savedFormations, setSavedFormations] = useState<SavedFormation[]>([]);
  const [labelInput, setLabelInput] = useState("Friendly Match");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const cardBackground: React.CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
  };

  const collectiveStrength = Math.round(
    Object.entries(squad).reduce((sum, [slotId, playerId]) => {
      const player = players.find((p) => p.id === playerId);
      const slot = FORMATION_PRESETS[formation].find((s) => s.id === slotId);
      if (!player || !slot) return sum;
      return sum + player.rating * getAptitudeMultiplier(player.position, slot.role);
    }, 0),
  );

  const activePitchIds = Object.values(squad);
  const reservePlayers = players.filter((p) => !activePitchIds.includes(p.id));

  const handleDragStart = (e: React.DragEvent, idOrSlot: string, source: "pitch" | "drawer") => {
    e.dataTransfer.setData("sourceType", source);
    e.dataTransfer.setData("payloadValue", idOrSlot);
  };

  const handleDropOnPitchSlot = (e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault();
    const sourceType = e.dataTransfer.getData("sourceType");
    const payloadValue = e.dataTransfer.getData("payloadValue");

    if (sourceType === "pitch") {
      const originSlotId = payloadValue;
      if (originSlotId === targetSlotId) return;
      setSquad((prev) => {
        const next = { ...prev };
        const holder = next[originSlotId];
        next[originSlotId] = next[targetSlotId];
        next[targetSlotId] = holder;
        return next;
      });
      toast.success("Positions swapped");
    } else if (sourceType === "drawer") {
      setSquad((prev) => ({ ...prev, [targetSlotId]: payloadValue }));
      toast.success("Player substituted onto the pitch");
    }
  };

  const saveFormationPreset = () => {
    const preset: SavedFormation = {
      id: Date.now().toString(),
      label: labelInput,
      formationType: formation,
      squad: { ...squad },
    };
    setSavedFormations((prev) => [...prev, preset]);
    toast.success(`Saved: ${labelInput}`);
  };

  const applyPreset = (preset: SavedFormation) => {
    setFormation(preset.formationType);
    setSquad(preset.squad);
    toast.success(`Loaded: ${preset.label}`);
  };

  const applyFormationReset = (type: FormationType) => {
    setFormation(type);
    const layoutSlots = FORMATION_PRESETS[type];
    const updatedSquad: Record<string, string> = {};
    layoutSlots.forEach((slot, index) => {
      updatedSquad[slot.id] = activePitchIds[index] || reservePlayers[index]?.id || players[0]?.id;
    });
    setSquad(updatedSquad);
  };

  const handleAutopick = () => {
    setSquad(autopickSquad(formation, players));
    toast.success("Squad optimized for peak strength", { icon: <Sparkles size={16} className="text-volt-400" /> });
  };

  return (
    <div className="h-full text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-400 uppercase tracking-wider px-4 py-1.5 rounded hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <h2 className="text-base font-black uppercase text-white tracking-wide">{teamName} Management Console</h2>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase px-3 py-1.5 rounded flex items-center gap-1.5 shadow-lg shadow-cyan-950/50"
        >
          <ArrowLeftRight size={13} /> Substitutes ({reservePlayers.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0 overflow-hidden z-10">
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded p-4 flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Formation</label>
              <button
                onClick={handleAutopick}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20"
              >
                Autopick
              </button>
            </div>
            <select
              value={formation}
              onChange={(e) => applyFormationReset(e.target.value as FormationType)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              {Object.keys(FORMATION_PRESETS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-800/60 pt-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Save formation as</label>
            <div className="flex gap-1.5 mb-3">
              <select
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
              >
                <option value="Friendly Match">Friendly Match</option>
                <option value="Tournament Run">Tournament Run</option>
                <option value="Local Derby">Local Derby</option>
                <option value="Championship Final">Championship Final</option>
              </select>
              <button
                onClick={saveFormationPreset}
                className="bg-lime-500 hover:bg-lime-600 text-slate-950 font-bold px-3 py-1 rounded text-2xs uppercase tracking-wide"
              >
                Save
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {savedFormations.length === 0 && (
                <p className="text-2xs text-slate-500">No saved formations yet — these stay for this session only.</p>
              )}
              {savedFormations.map((sf) => (
                <div key={sf.id} className="flex justify-between items-center bg-slate-950/80 p-2 rounded border border-slate-800 text-2xs">
                  <div>
                    <p className="font-bold text-white leading-tight">{sf.label}</p>
                    <p className="text-[10px] text-slate-500">{sf.formationType}</p>
                  </div>
                  <button
                    onClick={() => applyPreset(sf)}
                    className="text-[10px] font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-900/40 hover:bg-cyan-900/30"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto bg-slate-950/70 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
            <Avatar name={coach ? `${coach.firstName} ${coach.lastName}` : "?"} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {coach ? `${coach.firstName} ${coach.lastName}` : "No coach assigned"}
              </p>
              <p className="text-xs text-slate-400">Head Coach</p>
            </div>
            <button
              onClick={onEditColors}
              className="w-9 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
              title="Edit team colors"
            >
              <Palette size={16} className="text-slate-300" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 flex justify-center items-center h-full max-h-full overflow-hidden">
          <div className="relative w-full aspect-[4/5] max-w-[400px] bg-emerald-900 border-[3px] border-white/20 rounded-lg shadow-2xl overflow-hidden bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950">
            <div className="absolute inset-x-0 top-0 h-1/2 border-b border-white/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/10 rounded-full" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-16 border-b border-x border-white/10" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-t border-x border-white/10" />
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-24 h-2.5 bg-slate-950/60 border-t border-x border-white/30 z-10" />

            {FORMATION_PRESETS[formation].map((slot) => {
              const assignedPlayerId = squad[slot.id];
              const playerObj = players.find((p) => p.id === assignedPlayerId);
              return (
                <TacticalCard
                  key={slot.id}
                  slotId={slot.id}
                  positionLabel={slot.role}
                  top={slot.top}
                  left={slot.left}
                  player={playerObj}
                  cardBackground={cardBackground}
                  onDragStart={(e, _, source) => handleDragStart(e, slot.id, source)}
                  onDrop={handleDropOnPitchSlot}
                  onViewDetails={(p) => setSelectedPlayer(p)}
                />
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded p-4 text-center shadow-lg">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Collective Strength</h4>
            <p className="text-3xl font-mono font-black text-lime-400 tracking-tight">{collectiveStrength}</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded p-4 flex-1 flex flex-col shadow-lg">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Player Inspector</h4>
            {selectedPlayer ? (
              <div className="space-y-6 flex-1">
                <div className="relative aspect-[2/3] w-full max-w-[180px] mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl" style={cardBackground}>
                  <div className="absolute inset-0">
                    {selectedPlayer.photo ? (
                      <img src={selectedPlayer.photo} className="h-full w-full object-cover object-top" alt="" />
                    ) : (
                      <PlayerPlaceholder
                        image={mannequinPng}
                        name={selectedPlayer.name}
                        number={selectedPlayer.squadNumber}
                        nameTop="44%"
                        numberTop="47%"
                        numberSize="80px"
                        className="h-full w-full px-4"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                  <div className="absolute top-3 left-3 z-20">
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{selectedPlayer.position}</p>
                    <h3 className="text-lg font-black text-white leading-none mt-1 uppercase">
                      {selectedPlayer.name.split(" ")[0]}
                      <br />
                      {selectedPlayer.name.split(" ").slice(1).join(" ")}
                    </h3>
                  </div>
                  <div className="absolute top-3 right-3 text-right z-20">
                    <span className="text-3xl font-display font-black text-volt-400">{selectedPlayer.rating}</span>
                  </div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 italic leading-relaxed">
                    Role: {selectedPlayer.position} specialist <br />
                    Squad number: {selectedPlayer.squadNumber}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-8 text-center">
                <p className="text-xs text-slate-500 font-medium">Select a player from the pitch to inspect them</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-y-0 right-0 w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 shadow-2xl z-50 transform ${isDrawerOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out p-4 flex flex-col`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-black uppercase text-white tracking-wide">Substitutes & Reserves</h3>
            <p className="text-[10px] text-slate-400">Drag a player onto a pitch slot</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-slate-400 hover:text-white bg-slate-950 px-2 py-1 rounded text-xs border border-slate-800"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 content-start pr-1">
          {reservePlayers.length === 0 && (
            <p className="col-span-3 text-2xs text-slate-500 text-center pt-6">Every player is on the pitch.</p>
          )}
          {reservePlayers.map((player) => {
            const getRatingColor = (r: number) => (r >= 85 ? "text-volt-400" : r >= 70 ? "text-field-400" : "text-ice-400");
            return (
              <div
                key={player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, player.id, "drawer")}
                onClick={() => setSelectedPlayer(player)}
                className="relative aspect-[2/3] rounded-xl border border-white/5 bg-black overflow-hidden group cursor-grab hover:border-volt-400/30 transition-all shadow-lg"
                style={cardBackground}
              >
                <div className="absolute inset-0">
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-110" />
                  ) : (
                    <PlayerPlaceholder
                      image={mannequinPng}
                      name={player.name}
                      number={player.squadNumber}
                      nameSize="0px"
                      numberSize="32px"
                      numberTop="40%"
                      className="h-full w-full p-2 opacity-60"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                <div className="absolute top-1.5 left-1.5 right-1.5 z-20 flex justify-between items-center">
                  <div className="bg-slate-900/80 backdrop-blur-sm text-[6px] px-1 py-0.5 rounded border border-white/10 text-white font-bold uppercase tracking-tighter">
                    {player.position}
                  </div>
                  <div className={`font-display font-black text-[11px] leading-none drop-shadow-md ${getRatingColor(player.rating)}`}>
                    {player.rating}
                  </div>
                </div>
                <div className="absolute bottom-1 inset-x-0 px-1 z-20 text-center">
                  <p className="text-[8px] font-black text-white truncate uppercase tracking-tight drop-shadow-lg">
                    {player.name.split(" ").pop()}
                  </p>
                </div>
                <div className="absolute inset-0 border-2 border-volt-400/0 group-hover:border-volt-400/20 rounded-xl transition-all pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};