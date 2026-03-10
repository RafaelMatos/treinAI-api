import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
    userId: string;
    from: string;
    to: string;
}

interface OutputDto {
    workoutStreak: number;
    consistencyByDay: Record<string, {
        workoutDayCompleted: boolean;
        workoutDayStarted: boolean;
    }>;
    completedWorkoutsCount: number;
    conclusionRate: number;
    totalTimeInSeconds: number;
}

export class GetStats {
    async execute(dto: InputDto): Promise<OutputDto> {
        const fromDate = dayjs.utc(dto.from).startOf("day");
        const toDate = dayjs.utc(dto.to).endOf("day");

        // Fetch all sessions in the range for this user
        const sessions = await prisma.workoutSession.findMany({
            where: {
                workoutDay: {
                    workoutPlan: {
                        userId: dto.userId
                    }
                },
                startedAt: {
                    gte: fromDate.toDate(),
                    lte: toDate.toDate()
                }
            }
        });

        // Build consistencyByDay (only days with at least one session)
        const consistencyByDay: Record<string, { workoutDayCompleted: boolean; workoutDayStarted: boolean }> = {};

        for (const session of sessions) {
            const dateStr = dayjs(session.startedAt).utc().format("YYYY-MM-DD");

            if (!consistencyByDay[dateStr]) {
                consistencyByDay[dateStr] = {
                    workoutDayCompleted: false,
                    workoutDayStarted: false
                };
            }

            consistencyByDay[dateStr].workoutDayStarted = true;

            if (session.completedAt) {
                consistencyByDay[dateStr].workoutDayCompleted = true;
            }
        }

        // completedWorkoutsCount
        const completedWorkoutsCount = sessions.filter((s) => s.completedAt !== null).length;

        // conclusionRate
        const conclusionRate = sessions.length > 0
            ? completedWorkoutsCount / sessions.length
            : 0;

        // totalTimeInSeconds (sum of completedAt - startedAt for completed sessions)
        const totalTimeInSeconds = sessions
            .filter((s) => s.completedAt !== null)
            .reduce((acc, s) => {
                const start = dayjs(s.startedAt);
                const end = dayjs(s.completedAt!);
                return acc + end.diff(start, "second");
            }, 0);

        // workoutStreak: consecutive days with at least one completed session
        const allCompletedSessions = await prisma.workoutSession.findMany({
            where: {
                workoutDay: {
                    workoutPlan: {
                        userId: dto.userId
                    }
                },
                completedAt: {
                    not: null
                }
            },
            select: {
                completedAt: true
            },
            orderBy: {
                completedAt: "desc"
            }
        });

        const completedDates = new Set(
            allCompletedSessions.map((s) => dayjs(s.completedAt).utc().format("YYYY-MM-DD"))
        );

        let workoutStreak = 0;
        const todayStr = dayjs().utc().format("YYYY-MM-DD");
        const yesterdayStr = dayjs().utc().subtract(1, "day").format("YYYY-MM-DD");
        let currentCheckDate = dayjs().utc().startOf("day");

        if (!completedDates.has(todayStr)) {
            if (completedDates.has(yesterdayStr)) {
                currentCheckDate = currentCheckDate.subtract(1, "day");
            }
        }

        if (completedDates.has(currentCheckDate.format("YYYY-MM-DD"))) {
            while (completedDates.has(currentCheckDate.format("YYYY-MM-DD"))) {
                workoutStreak++;
                currentCheckDate = currentCheckDate.subtract(1, "day");
            }
        }

        return {
            workoutStreak,
            consistencyByDay,
            completedWorkoutsCount,
            conclusionRate,
            totalTimeInSeconds
        };
    }
}
