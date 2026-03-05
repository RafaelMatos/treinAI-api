export class NotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "NotFoundError"
    }
}

export class WorkoutPlanNotActiveError extends Error {
    constructor(message: string = "Workout plan is not active") {
        super(message)
        this.name = "WorkoutPlanNotActiveError"
    }
}

export class SessionAlreadyStartedError extends Error {
    constructor(message: string = "A session for this workout day has already been started") {
        super(message)
        this.name = "SessionAlreadyStartedError"
    }
}