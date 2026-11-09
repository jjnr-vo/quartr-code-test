type AppError = Error & { status: number; code: string };

export type AppErrorArgs = {
  status: number;
  code: string;
  message: string;
};

export function appError({ status, code, message }: AppErrorArgs): AppError {
  return Object.assign(new Error(message), { name: "AppError", status, code });
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && error.name === "AppError";
}
