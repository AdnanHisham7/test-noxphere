// src/features/teams/tactics/TacticalCard.tsx
import React from "react";
import { clsx } from "clsx";
import { Player, Position } from "./types";
import { PlayerPlaceholder } from "../../../components/ui/PlayerPlaceholder";
import mannequinPng from "../../../assets/players/mannequin.png";

interface TacticalCardProps {
  player?: Player;
  positionLabel: Position;
  slotId: string;
  top: number;
  left: number;
  onDragStart: (e: React.DragEvent, id: string, source: "pitch" | "drawer") => void;
  onDrop: (e: React.DragEvent, targetSlotId: string) => void;
  onViewDetails: (player: Player) => void;
  cardBackground: React.CSSProperties;
}

export const TacticalCard: React.FC<TacticalCardProps> = ({
  player,
  cardBackground,
  positionLabel,
  slotId,
  top,
  left,
  onDragStart,
  onDrop,
  onViewDetails,
}) => {
  const getRatingColor = (r: number) => (r >= 85 ? "text-volt-400" : r >= 70 ? "text-field-400" : "text-ice-400");

  const getBadgeColor = (pos: string) => {
    if (["CF", "RWF", "LWF", "SS"].includes(pos)) return "bg-ember-600";
    if (["AMF", "CMF", "DMF", "LMF", "RMF"].includes(pos)) return "bg-green-600";
    if (pos === "GK") return "bg-yellow-600";
    return "bg-blue-600";
  };

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 select-none z-20 group"
      style={{ top: `${top}%`, left: `${left}%` }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, slotId)}
    >
      {player ? (
        <div
          draggable
          onDragStart={(e) => onDragStart(e, player.id, "pitch")}
          onClick={() => onViewDetails(player)}
          className="relative w-[82px] aspect-square rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl transition-all hover:scale-110 hover:border-volt-400/80 cursor-grab active:cursor-grabbing"
          style={cardBackground}
        >
          <div className="absolute inset-0 z-0">
            {player.photo ? (
              <img
                src={player.photo}
                className="h-full w-full object-cover object-[center_15%] scale-[0.8] opacity-90 transition-transform group-hover:scale-105"
                alt=""
              />
            ) : (
              <PlayerPlaceholder
                image={mannequinPng}
                name={player.name}
                number={player.squadNumber}
                className="h-full w-full p-2 opacity-90"
                nameSize="0px"
                numberSize="22px"
                numberTop="30%"
              />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />

          <div className="absolute top-1.5 left-1.5 right-1.5 z-20 flex justify-between items-center">
            <span className={clsx("text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm text-white uppercase tracking-tighter", getBadgeColor(positionLabel))}>
              {positionLabel}
            </span>
            <span className={clsx("text-[13px] font-display font-black leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]", getRatingColor(player.rating))}>
              {player.rating}
            </span>
          </div>

          <div className="absolute bottom-0 inset-x-0 z-20 bg-black/60 backdrop-blur-sm rounded-b-2xl border-t border-white/5">
            <p className="text-[9px] font-black text-white truncate text-center uppercase tracking-tight">
              {player.name.split(" ").pop()}
            </p>
          </div>
        </div>
      ) : (
        <div className="w-[78px] aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/10">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{positionLabel}</span>
        </div>
      )}
    </div>
  );
};