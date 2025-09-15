// YYYY-MM-DD HH:mm:ss (KST, 24h)
export function formatKST(input?: string | Date | null) {
  if (!input) return "";
  // 문자열이면 Date로: "YYYY-MM-DD HH:mm:ss" 같은 naive 문자열 대비
  let s = typeof input === "string" ? input.trim() : "";
  if (typeof input === "string") {
    // 타임존 표기가 없고 'YYYY-MM-DD HH:mm:ss' 패턴이면 UTC로 가정해서 Z 부여
    if (
      !/[zZ]|[+\-]\d{2}:?\d{2}$/.test(s) &&
      /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)
    ) {
      s = s.replace(" ", "T") + "Z";
    } else if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      // 이미 ISO 형식이면 그대로 사용
    }
  }
  const date = typeof input === "string" ? new Date(s) : input;
  if (isNaN(+date)) return "";

  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}
