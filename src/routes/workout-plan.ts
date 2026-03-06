import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { NotFoundError, WorkoutPlanNotActiveError, SessionAlreadyStartedError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { ErrorSchema, WorkoutPlanSchema, StartWorkoutSessionParamsSchema, StartWorkoutSessionResponseSchema, UpdateWorkoutSessionParamsSchema, UpdateWorkoutSessionBodySchema, UpdateWorkoutSessionResponseSchema, GetWorkoutPlanParamsSchema, GetWorkoutPlanResponseSchema } from "../schemas/index.js";
import { CreateWorkoutPlan } from "../usecases/create-workout-plan.js";
import { StartWorkoutSession } from "../usecases/start-workout-session.js";
import { UpdateWorkoutSession } from "../usecases/update-workout-session.js";
import { GetWorkoutPlan } from "../usecases/get-workout-plan.js";

export const wourkoutPlanRoutes = async (app: FastifyInstance) => {


    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/',
        schema: {
            tags: ["Workout Plan"],
            summary: "Create a workout plan",
            body: WorkoutPlanSchema.omit({ id: true }),
            response: {
                201: WorkoutPlanSchema,
                400: ErrorSchema,
                401: ErrorSchema,
                404: ErrorSchema,
                500: ErrorSchema
            }
        },
        handler: async (request, reply) => {
            try {

                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(request.headers)
                })

                if (!session) {
                    return reply.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED"
                    })
                }

                const createWorkoutPlan = new CreateWorkoutPlan();

                const result = await createWorkoutPlan.execute({
                    userId: session.user.id,
                    name: request.body.name,
                    workoutDays: request.body.workoutDays
                })

                return reply.status(201).send(result)
            } catch (error) {
                app.log.error(error)

                if (error instanceof NotFoundError) {
                    return reply.status(404).send({
                        error: error.message,
                        code: "NOT_FOUND_ERROR"
                    })
                }

                return reply.status(500).send({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR"
                })
            }
        }
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/:id/days/:dayId/sessions',
        schema: {
            tags: ["Workout Plan"],
            summary: "Start a workout session",
            params: StartWorkoutSessionParamsSchema,
            response: {
                201: StartWorkoutSessionResponseSchema,
                401: ErrorSchema,
                404: ErrorSchema,
                409: ErrorSchema,
                500: ErrorSchema
            }
        },
        handler: async (request, reply) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(request.headers)
                })

                if (!session) {
                    return reply.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED"
                    })
                }

                const startWorkoutSession = new StartWorkoutSession();

                const result = await startWorkoutSession.execute({
                    userId: session.user.id,
                    workoutPlanId: request.params.id,
                    workoutDayId: request.params.dayId
                })

                return reply.status(201).send(result)
            } catch (error) {
                app.log.error(error)

                if (error instanceof NotFoundError) {
                    return reply.status(404).send({
                        error: error.message,
                        code: "NOT_FOUND_ERROR"
                    })
                }

                if (error instanceof WorkoutPlanNotActiveError) {
                    return reply.status(409).send({
                        error: error.message,
                        code: "WORKOUT_PLAN_NOT_ACTIVE_ERROR"
                    })
                }

                if (error instanceof SessionAlreadyStartedError) {
                    return reply.status(409).send({
                        error: error.message,
                        code: "SESSION_ALREADY_STARTED_ERROR"
                    })
                }

                return reply.status(500).send({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR"
                })
            }
        }
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'PATCH',
        url: '/:id/days/:dayId/sessions/:sessionId',
        schema: {
            tags: ["Workout Plan"],
            summary: "Update a workout session",
            params: UpdateWorkoutSessionParamsSchema,
            body: UpdateWorkoutSessionBodySchema,
            response: {
                200: UpdateWorkoutSessionResponseSchema,
                401: ErrorSchema,
                404: ErrorSchema,
                500: ErrorSchema
            }
        },
        handler: async (request, reply) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(request.headers)
                })

                if (!session) {
                    return reply.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED"
                    })
                }

                const updateWorkoutSession = new UpdateWorkoutSession();

                const result = await updateWorkoutSession.execute({
                    userId: session.user.id,
                    workoutPlanId: request.params.id,
                    workoutDayId: request.params.dayId,
                    sessionId: request.params.sessionId,
                    completedAt: request.body.completedAt
                })

                return reply.status(200).send(result)
            } catch (error) {
                app.log.error(error)

                if (error instanceof NotFoundError) {
                    return reply.status(404).send({
                        error: error.message,
                        code: "NOT_FOUND_ERROR"
                    })
                }

                return reply.status(500).send({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR"
                })
            }
        }
    })

    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/:id',
        schema: {
            tags: ["Workout Plan"],
            summary: "Get a workout plan by id",
            params: GetWorkoutPlanParamsSchema,
            response: {
                200: GetWorkoutPlanResponseSchema,
                401: ErrorSchema,
                404: ErrorSchema,
                500: ErrorSchema
            }
        },
        handler: async (request, reply) => {
            try {
                const session = await auth.api.getSession({
                    headers: fromNodeHeaders(request.headers)
                })

                if (!session) {
                    return reply.status(401).send({
                        error: "Unauthorized",
                        code: "UNAUTHORIZED"
                    })
                }

                const getWorkoutPlan = new GetWorkoutPlan();
                const result = await getWorkoutPlan.execute({
                    userId: session.user.id,
                    workoutPlanId: request.params.id
                })

                return reply.status(200).send(result)
            } catch (error) {
                app.log.error(error)

                if (error instanceof NotFoundError) {
                    return reply.status(404).send({
                        error: error.message,
                        code: "NOT_FOUND_ERROR"
                    })
                }

                return reply.status(500).send({
                    error: "Internal server error",
                    code: "INTERNAL_SERVER_ERROR"
                })
            }
        }
    })

}