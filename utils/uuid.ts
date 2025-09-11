// utils/uuid.ts
export function generateId(): string {
  // 1. crypto.randomUUID가 있으면 사용
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // HTTPS가 아닌 경우 에러 발생할 수 있음
    }
  }

  // 2. 폴백: Math.random() 기반 UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 짧은 ID가 필요한 경우
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 15);
}
