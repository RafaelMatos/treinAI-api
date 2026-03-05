import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
    userId: string;
    workoutPlanId: string;
    workoutDayId: string;
    sessionId: string;
    completedAt: string;
}

interface OutputDto {
    id: string;
    completedAt: string;
    startedAt: string;
}

export class UpdateWorkoutSession {
    async execute(dto: InputDto): Promise<OutputDto> {
        const workoutPlan = await prisma.workoutPlan.findUnique({
            where: {
                id: dto.workoutPlanId,
                userId: dto.userId
            },
            include: {
                workoutDays: {
                    where: {
                        id: dto.workoutDayId
                    }
                }
            }
        });

        if (!workoutPlan || workoutPlan.workoutDays.length === 0) {
            throw new NotFoundError("Workout plan or day not found");
        }

        const existingSession = await prisma.workoutSession.findUnique({
            where: {
                id: dto.sessionId,
                workoutDayId: dto.workoutDayId
            }
        });

        if (!existingSession) {
            throw new NotFoundError("Session not found");
        }

        const updatedSession = await prisma.workoutSession.update({
            where: { id: dto.sessionId },
            data: {
                completedAt: new Date(dto.completedAt)
            }
        });

        return {
            id: updatedSession.id,
            completedAt: updatedSession.completedAt ? updatedSession.completedAt.toISOString() : "",
            startedAt: updatedSession.startedAt.toISOString()
        };
    }
}
