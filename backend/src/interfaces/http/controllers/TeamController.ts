import { Request, Response, NextFunction } from "express";
import { TeamUseCases } from "../../../application/use-cases/team/TeamUseCases";
import { ResponseHandler } from "../../../shared/utils/ResponseHandler";
import { BadRequestError } from "../../../shared/errors/AppError";

export class TeamController {
  constructor(private teamUseCases: TeamUseCases) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, ageGroup, franchiseId, coachId, description, logoUrl, bannerUrl, primaryColor, secondaryColor } = req.body;
      if (!name || !ageGroup || !franchiseId) {
        throw new BadRequestError("name, ageGroup and franchiseId are required");
      }
      const team = await this.teamUseCases.createTeam({
        name,
        ageGroup,
        franchiseId,
        coachId,
        description,
        logoUrl,
        bannerUrl,
        primaryColor,
        secondaryColor,
      });
      ResponseHandler.created(res, team, "Team created");
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { franchiseId } = req.query;
      if (!franchiseId) throw new BadRequestError("franchiseId is required");
      // A coach only ever sees the teams assigned to them, regardless of
      // what (if anything) was passed in the coachId query param.
      const coachId =
        req.user!.role === "coach" ? req.user!.sub : (req.query.coachId as string | undefined);
      const teams = await this.teamUseCases.listTeams(franchiseId as string);
      ResponseHandler.success(res, teams, "Teams retrieved");
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await this.teamUseCases.getTeamById(req.params.id);
      ResponseHandler.success(res, team, "Team retrieved");
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await this.teamUseCases.updateTeam(req.params.id, req.body);
      ResponseHandler.success(res, team, "Team updated");
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.teamUseCases.deleteTeam(req.params.id);
      ResponseHandler.noContent(res, "Team deleted");
    } catch (err) {
      next(err);
    }
  };
}