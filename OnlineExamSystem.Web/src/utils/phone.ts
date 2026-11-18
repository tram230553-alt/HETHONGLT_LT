// Số điện thoại hợp lệ: đúng 10 chữ số, không có khoảng trắng hay ký tự khác.
export const PHONE_LENGTH = 10;

export const PHONE_ERROR_MESSAGE = "Số điện thoại phải gồm đúng 10 chữ số.";

// Dùng trong onChange: chỉ giữ lại chữ số và cắt tối đa 10 số.
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

export function isValidPhone(value: string): boolean {
  return /^\d{10}$/.test(value);
}
