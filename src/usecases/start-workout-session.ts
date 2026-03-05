import { NotFoundError, SessionAlreadyStartedError, WorkoutPlanNotActiveError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
    userId: string;
    workoutPlanId: string;
    workoutDayId: string;
}

interface OutputDto {
    userWorkoutSessionId: string;
}

export class StartWorkoutSession {
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

        if (!workoutPlan.isActive) {
            throw new WorkoutPlanNotActiveError();
        }

        const existingSession = await prisma.workoutSession.findFirst({
            where: {
                workoutDayId: dto.workoutDayId,
                completedAt: null
            }
        });

        if (existingSession) {
            throw new SessionAlreadyStartedError();
        }

        const session = await prisma.workoutSession.create({
            data: {
                workoutDayId: dto.workoutDayId,
                startedAt: new Date()
            }
        });

        return {
            userWorkoutSessionId: session.id
        };
    }
}
