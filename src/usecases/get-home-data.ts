import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { prisma } from "../lib/db.js";
import { WeekDay } from "../generated/prisma/enums.js";

dayjs.extend(utc);

const weekDayMap: Record<number, WeekDay> = {
    0: WeekDay.SUNDAY,
    1: WeekDay.MONDAY,
    2: WeekDay.TUESDAY,
    3: WeekDay.WEDNESDAY,
    4: WeekDay.THURSDAY,
    5: WeekDay.FRIDAY,
    6: WeekDay.SATURDAY
};

interface InputDto {
    userId: string;
    date: string;
}

interface OutputDto {
    activeWorkoutPlanId: string | null;
    todayWorkoutDay: {
        workoutPlanId: string;
        id: string;
        name: string;
        isRest: boolean;
        weekDay: WeekDay;
        estimatedDurationInSeconds: number;
        coverImageUrl?: string;
        exercisesCount: number;
    } | null;
    workoutStreak: number;
    consistencyByDay: Record<string, {
        workoutDayCompleted: boolean;
        workoutDayStarted: boolean;
    }>;
}

export class GetHomeData {
    async execute(dto: InputDto): Promise<OutputDto> {
        const referenceDate = dayjs.utc(dto.date).startOf('day');

        // 1. Get Consistency By Day (current week Sun-Sat)
        const startOfWeek = referenceDate.startOf('week'); // Sunday
        const endOfWeek = referenceDate.endOf('week'); // Saturday

        const consistencyByDay: Record<string, { workoutDayCompleted: boolean; workoutDayStarted: boolean }> = {};

        // Initialize all days in the week
        for (let i = 0; i <= 6; i++) {
            const dateStr = startOfWeek.add(i, 'day').format('YYYY-MM-DD');
            consistencyByDay[dateStr] = {
                workoutDayCompleted: false,
                workoutDayStarted: false
            };
        }

        const sessionsThisWeek = await prisma.workoutSession.findMany({
            where: {
                workoutDay: {
                    workoutPlan: {
                        userId: dto.userId
                    }
                },
                startedAt: {
                    gte: startOfWeek.toDate(),
                    lte: endOfWeek.toDate()
                }
            }
        });

        for (const session of sessionsThisWeek) {
            const sessionDateStr = dayjs(session.startedAt).utc().format('YYYY-MM-DD');
            if (consistencyByDay[sessionDateStr]) {
                consistencyByDay[sessionDateStr].workoutDayStarted = true;
                if (session.completedAt) {
                    consistencyByDay[sessionDateStr].workoutDayCompleted = true;
                }
            }
        }

        // 2. Active Workout Plan and Today Workout Day
        const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
            where: {
                userId: dto.userId,
                isActive: true
            },
            include: {
                workoutDays: {
                    include: {
                        _count: {
                            select: { exercises: true }
                        }
                    }
                }
            }
        });

        let todayWorkoutDay = null;
        let activeWorkoutPlanId = null;

        if (activeWorkoutPlan) {
            activeWorkoutPlanId = activeWorkoutPlan.id;
            const weekDayEnum = weekDayMap[referenceDate.day()];

            const foundDay = activeWorkoutPlan.workoutDays.find(d => d.weekDay === weekDayEnum);
            if (foundDay) {
                todayWorkoutDay = {
                    workoutPlanId: foundDay.workoutPlanId,
                    id: foundDay.id,
                    name: foundDay.name,
                    isRest: foundDay.isRest,
                    weekDay: foundDay.weekDay,
                    estimatedDurationInSeconds: foundDay.estimatedDurationInSeconds,
                    coverImageUrl: foundDay.coverImageUrl ?? undefined,
                    exercisesCount: foundDay._count.exercises
                };
            }
        }

        // 3. Workout Streak
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
                completedAt: 'desc'
            }
        });

        const completedDates = new Set(
            allCompletedSessions.map(s => dayjs(s.completedAt).utc().format('YYYY-MM-DD'))
        );

        let workoutStreak = 0;
        let todayStr = dayjs().utc().format('YYYY-MM-DD');
        let yesterdayStr = dayjs().utc().subtract(1, 'day').format('YYYY-MM-DD');
        let currentCheckDate = dayjs().utc().startOf('day');

        if (!completedDates.has(todayStr)) {
            if (completedDates.has(yesterdayStr)) {
                currentCheckDate = currentCheckDate.subtract(1, 'day');
            }
        }

        if (completedDates.has(currentCheckDate.format('YYYY-MM-DD'))) {
            while (completedDates.has(currentCheckDate.format('YYYY-MM-DD'))) {
                workoutStreak++;
                currentCheckDate = currentCheckDate.subtract(1, 'day');
            }
        }

        return {
            activeWorkoutPlanId,
            todayWorkoutDay,
            workoutStreak,
            consistencyByDay
        };
    }
}
