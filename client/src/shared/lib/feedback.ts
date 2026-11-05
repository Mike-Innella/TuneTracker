type FieldErrors = Record<string, string[] | undefined>;

type ErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      error?: string;
      details?: {
        fieldErrors?: FieldErrors;
      };
    };
  };
};

function asErrorLike(error: unknown): ErrorLike | null {
  return typeof error === 'object' && error !== null ? (error as ErrorLike) : null;
}

function getFieldErrors(error: unknown): FieldErrors | undefined {
  return asErrorLike(error)?.response?.data?.details?.fieldErrors;
}

export function getStatusCode(error: unknown) {
  return asErrorLike(error)?.response?.status;
}

export function getErrorMessage(error: unknown, fallback: string) {
  const errorLike = asErrorLike(error);
  return errorLike?.response?.data?.error || errorLike?.message || fallback;
}

export function getFormErrorMessage(error: unknown, fallback: string) {
  const fieldErrors = getFieldErrors(error);
  const firstFieldError = fieldErrors
    ? Object.values(fieldErrors)
        .flat()
        .find((message) => Boolean(message))
    : null;

  return firstFieldError || getErrorMessage(error, fallback);
}
