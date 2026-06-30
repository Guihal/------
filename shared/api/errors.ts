import type { ApiErrorResponse } from "../contracts";

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorResponse;

  constructor(status: number, body: ApiErrorResponse) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// Codes mirror backend/internal/httpserver writeError calls.
const codeMessages: Record<string, string> = {
  bad_request: "Проверьте данные и попробуйте снова.",
  validation_error: "Проверьте выделенные поля.",
  invalid_input: "Проверьте данные формы.",
  invalid_id: "Неверный идентификатор.",
  invalid_active: "Неверное значение фильтра.",
  invalid_date: "Неверная дата.",
  invalid_type: "Этот тип файла не поддерживается.",
  invalid_user_id: "Неверный идентификатор пользователя.",
  slot_mismatch: "Этот предмет не подходит для слота маскота.",
  invalid_credentials: "Неверный email или пароль.",
  email_taken: "Этот email уже зарегистрирован.",
  unauthorized: "Нужно войти в аккаунт.",
  forbidden: "Недостаточно прав для этого действия.",
  not_found: "Запрошенные данные не найдены.",
  conflict: "Данные уже изменились. Обновите страницу.",
  too_large: "Файл слишком большой (до 2 МБ).",
  rate_limited: "Слишком много попыток. Попробуйте позже.",
  internal: "Не удалось выполнить действие. Попробуйте позже.",
  internal_error: "Не удалось выполнить действие. Попробуйте позже.",
};

export type UiApiError = {
  title: string;
  fieldErrors: Record<string, string>;
  requestId?: string;
  status?: number;
};

export function mapApiError(error: unknown): UiApiError {
  if (error instanceof ApiError) {
    return {
      title: codeMessages[error.body.code] ?? error.body.message,
      fieldErrors: error.body.field_errors ?? {},
      requestId: error.body.request_id,
      status: error.status,
    };
  }

  return {
    title: "Нет связи с сервером. Проверьте подключение.",
    fieldErrors: {},
  };
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
