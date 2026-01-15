// utils/filename.ts

/**
 * 파일명에서 확장자를 제거하는 유틸리티 함수
 * .pdf.pdf 같은 중복 확장자도 모두 제거
 * @param filename - 전체 파일명 (예: "document.pdf.pdf")
 * @returns 확장자가 제거된 파일명 (예: "document")
 */
export function removeFileExtension(filename: string): string {
  if (!filename) return "";

  // .pdf, .PDF 같은 중복 확장자를 모두 제거
  const pdfPattern = /\.pdf$/i;
  let result = filename;

  // .pdf가 더 이상 없을 때까지 반복 제거
  while (pdfPattern.test(result)) {
    result = result.replace(pdfPattern, "");
  }

  // 그 외 일반 확장자도 제거 (마지막 점 기준)
  const lastDotIndex = result.lastIndexOf(".");

  // 점이 있고, 파일명 중간이나 끝에 있으면 제거
  if (lastDotIndex > 0) {
    result = result.substring(0, lastDotIndex);
  }

  return result;
}

/**
 * 파일명의 확장자만 추출하는 함수
 * @param filename - 전체 파일명
 * @returns 확장자 (점 포함, 예: ".pdf")
 */
export function getFileExtension(filename: string): string {
  if (!filename) return "";

  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex <= 0) return "";

  return filename.substring(lastDotIndex);
}

/**
 * 파일 경로에서 파일명만 추출하고 확장자 제거
 * @param filepath - 파일 경로 (예: "uploaded/123/document.pdf.pdf")
 * @returns 확장자가 제거된 파일명 (예: "document")
 */
export function getFilenameWithoutExtension(filepath: string): string {
  if (!filepath) return "";

  // 경로에서 파일명 추출
  const filename = filepath.split("/").pop() || filepath;

  // 확장자 제거 (중복 제거 포함)
  return removeFileExtension(filename);
}

/**
 * 제목 표시용 함수 - 확장자 제거 및 대체 텍스트 처리
 * @param title - 표시할 제목
 * @param fallback - 제목이 없을 때 사용할 대체 텍스트
 * @returns 처리된 제목
 */
export function getDisplayTitle(
  title?: string,
  fallback: string = "문서"
): string {
  if (!title) return fallback;

  return removeFileExtension(title);
}

/**
 * 안전한 PDF 파일명 생성 (내부 사용)
 * 중복 .pdf 확장자를 제거하고 하나만 붙임
 * @param name - 파일명
 * @returns 정규화된 PDF 파일명
 */
export function safePdfName(name: string): string {
  if (!name) return "document.pdf";

  // 특수문자 제거
  const cleaned = name.replace(/[\\/:*?"<>|]+/g, "_").trim();

  // 중복 .pdf 제거
  const withoutExtension = removeFileExtension(cleaned);

  // .pdf 확장자 하나만 추가
  return `${withoutExtension}.pdf`;
}
