// src/features/teams/TeamManagePage.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useGetTeamByIdQuery } from "../../store/api/teamsApi";
import { EmptyState, Skeleton, Button } from "../../components/ui";
import { ManageTeamView } from "./tactics/ManageTeamView";
import type { Player, Position } from "./tactics/types";

const MIN_PLAYERS_FOR_CONSOLE = 10;

// The roster only stores a coarse position (Forward/Midfielder/Defender/
// Goalkeeper) chosen at enrollment. The tactics console works with
// granular formation roles, so this picks a sensible starting slot —
// coaches can freely drag any player into any slot afterwards regardless
// of this default.
function toTacticalPosition(position?: string): Position {
  switch (position) {
    case "Goalkeeper":
      return "GK";
    case "Defender":
      return "CB";
    case "Midfielder":
      return "CMF";
    case "Forward":
      return "CF";
    default:
      return "CMF";
  }
}

// Player cards show a 0-100 rating. overallRating is stored 0-10, and a
// newly-enrolled, never-scored player would otherwise show a jarring "0" —
// floored so an unrated squad still looks like a real card set.
function toCardRating(overallRating: number): number {
  return Math.max(50, Math.round(overallRating * 10));
}

const TeamManagePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: team, isLoading, isError } = useGetTeamByIdQuery(id ?? "", { skip: !id });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="p-6">
        <EmptyState title="Couldn't load this team" description="It may have been deleted, or you don't have access to it." />
      </div>
    );
  }

  if (team.students.length < MIN_PLAYERS_FOR_CONSOLE) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldAlert size={28} />}
          title="Not enough players yet"
          description={`${team.name} has ${team.students.length} player${team.students.length === 1 ? "" : "s"}. The team management console unlocks once a team has at least ${MIN_PLAYERS_FOR_CONSOLE} players.`}
        />
        <div className="flex justify-center mt-4">
          <Button variant="secondary" onClick={() => navigate("/teams")}>Back to Teams</Button>
        </div>
      </div>
    );
  }

  const players: Player[] = team.students.map((s, idx) => ({
    id: s._id,
    name: `${s.firstName} ${s.lastName}`,
    rating: toCardRating(s.overallRating ?? 0),
    position: toTacticalPosition(s.position),
    squadNumber: s.jerseyNumber ?? idx + 1,
    photo: s.photo,
  }));

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <ManageTeamView
        teamName={team.name}
        players={players}
        coach={team.coachId ?? null}
        primaryColor={team.primaryColor ?? "#1f2937"}
        secondaryColor={team.secondaryColor ?? "#334155"}
        onBack={() => navigate("/teams")}
        onEditColors={() => navigate("/teams")}
      />
    </div>
  );
};

export default TeamManagePage;