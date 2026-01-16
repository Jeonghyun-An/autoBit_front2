// utils/filename.ts

/**
 * 일반적인 파일 확장자 목록
 * 이 목록에 있는 확장자만 제거됩니다
 */
const COMMON_EXTENSIONS = [
  // 문서
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".odp",
  ".rtf",
  ".txt",
  ".csv",
  // 이미지
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".svg",
  ".webp",
  ".tif",
  ".tiff",
  // 압축
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".bz2",
  // 기타
  ".html",
  ".htm",
  ".xml",
  ".json",
  ".md",
];

/**
 * 파일명에서 일반적인 확장자만 제거하는 함수
 * @param filename - 전체 파일명
 * @returns 확장자가 제거된 파일명
 */
export function removeFileExtension(filename: string): string {
  if (!filename) return "";

  let result = filename;

  // 1. .pdf.pdf 같은 중복 확장자를 모두 제거
  const pdfPattern = /\.pdf$/i;
  while (pdfPattern.test(result)) {
    result = result.replace(pdfPattern, "");
  }

  // 2. 마지막 확장자가 일반적인 확장자 목록에 있으면 제거
  const lastDotIndex = result.lastIndexOf(".");

  if (lastDotIndex > 0) {
    const extension = result.substring(lastDotIndex).toLowerCase();

    // 일반적인 확장자인 경우에만 제거
    if (COMMON_EXTENSIONS.includes(extension)) {
      result = result.substring(0, lastDotIndex);
    }
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

  // 확장자 제거 (일반적인 확장자만)
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

  // 확장자 제거 (일반적인 확장자만)
  const withoutExtension = removeFileExtension(cleaned);

  // .pdf 확장자 하나만 추가
  return `${withoutExtension}.pdf`;
}
