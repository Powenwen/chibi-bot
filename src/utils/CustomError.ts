export class CustomError extends Error {
    public readonly code: string;
    public readonly userMessage?: string | undefined;
    public readonly severity: 'low' | 'medium' | 'high' | 'critical';
    public readonly isOperational: boolean;
    public readonly context?: Record<string, unknown> | undefined;

    constructor(
        message: string,
        code: string,
        userMessage?: string,
        severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
        isOperational = true,
        context?: Record<string, unknown>
    ) {
        super(message);
        
        this.name = 'CustomError';
        this.code = code;
        this.userMessage = userMessage;
        this.severity = severity;
        this.isOperational = isOperational;
        this.context = context;

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, CustomError);
    }

    public static validation(message: string, userMessage?: string): CustomError {
        return new CustomError(message, 'VALIDATION_ERROR', userMessage, 'low');
    }

    public static permission(message: string, userMessage?: string): CustomError {
        return new CustomError(message, 'PERMISSION_ERROR', userMessage || 'You do not have permission to perform this action.', 'medium');
    }

    public static notFound(resource: string, userMessage?: string): CustomError {
        return new CustomError(`${resource} not found`, 'NOT_FOUND', userMessage || 'The requested resource was not found.', 'low');
    }

    public static database(message: string, userMessage?: string): CustomError {
        return new CustomError(message, 'DATABASE_ERROR', userMessage || 'A database error occurred.', 'critical');
    }

    public static external(service: string, message: string, userMessage?: string): CustomError {
        return new CustomError(
            `External service error (${service}): ${message}`, 
            'EXTERNAL_SERVICE_ERROR', 
            userMessage || 'An external service is currently unavailable.',
            'high'
        );
    }
}