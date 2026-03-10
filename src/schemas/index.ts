
import z from "zod";

import { WeekDay } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
    error: z.string(),
    code: z.string(),
})

export const WorkoutPlanSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1),
    workoutDays: z.array(
        z.object({
            name: z.string().trim().min(1),
            weekDay: z.enum(WeekDay),
            isRest: z.boolean().default(false),
            estimatedDurationInSeconds: z.number().min(1),
            coverImageUrl: z.url().optional(),
            exercises: z.array(
                z.object({
                    order: z.number().min(0),
                    name: z.string().trim().min(1),
                    sets: z.number().min(1),
                    reps: z.number().min(1),
                    restTimeInSeconds: z.number().min(1),
                })
            )
        })
    ),
})

export const StartWorkoutSessionParamsSchema = z.object({
    id: z.string().uuid(),
    dayId: z.string().uuid()
})

export const StartWorkoutSessionResponseSchema = z.object({
    userWorkoutSessionId: z.string().uuid()
})

export const UpdateWorkoutSessionParamsSchema = z.object({
    id: z.string().uuid(),
    dayId: z.string().uuid(),
    sessionId: z.string().uuid()
})

export const UpdateWorkoutSessionBodySchema = z.object({
    completedAt: z.string().datetime()
})

export const UpdateWorkoutSessionResponseSchema = z.object({
    id: z.string().uuid(),
    completedAt: z.string().datetime(),
    startedAt: z.string().datetime(),
})

export const GetHomeDataParamsSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in format YYYY-MM-DD")
})

export const GetHomeDataResponseSchema = z.object({
    activeWorkoutPlanId: z.string().uuid().nullable(),
    todayWorkoutDay: z.object({
        workoutPlanId: z.string().uuid(),
        id: z.string().uuid(),
        name: z.string(),
        isRest: z.boolean(),
        weekDay: z.enum(WeekDay),
        estimatedDurationInSeconds: z.number(),
        coverImageUrl: z.string().url().optional(),
        exercisesCount: z.number()
    }).nullable(),
    workoutStreak: z.number(),
    consistencyByDay: z.record(z.string(), z.object({
        workoutDayCompleted: z.boolean(),
        workoutDayStarted: z.boolean()
    }))
})

export const GetWorkoutPlanParamsSchema = z.object({
    id: z.string().uuid()
})

export const GetWorkoutPlanResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    workoutDays: z.array(z.object({
        id: z.string().uuid(),
        weekDay: z.enum(WeekDay),
        name: z.string(),
        isRest: z.boolean(),
        coverImageUrl: z.string().url().optional(),
        estimatedDurationInSeconds: z.number(),
        exercisesCount: z.number()
    }))
})

export const GetWorkoutDayParamsSchema = z.object({
    id: z.string().uuid(),
    dayId: z.string().uuid()
})

export const GetWorkoutDayResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    isRest: z.boolean(),
    coverImageUrl: z.string().url().optional(),
    estimatedDurationInSeconds: z.number(),
    weekDay: z.enum(WeekDay),
    exercises: z.array(z.object({
        id: z.string().uuid(),
        name: z.string(),
        order: z.number(),
        sets: z.number(),
        reps: z.number(),
        restTimeInSeconds: z.number()
    })),
    sessions: z.array(z.object({
        id: z.string().uuid(),
        workoutDayId: z.string().uuid(),
        startedAt: z.string().datetime().optional(),
        completedAt: z.string().datetime().optional()
    }))
})