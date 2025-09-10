// 전역 Crypto에 randomUUID/getRandomValues가 없을 수도 있다는 가정으로 안전 선언
export {};

declare global {
  interface Crypto {
    randomUUID?: () => string;
    getRandomValues?<T extends ArrayBufferView>(array: T): T;
  }
  // 일부 런타임에서 globalThis.crypto 자체가 없을 수도 있음
  var crypto: Crypto | undefined;
}
