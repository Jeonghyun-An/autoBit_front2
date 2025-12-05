<template>
  <div>
    <NuxtLayout>
      <NuxtPage
        :keepalive="{
          include: ['chat', 'chunks'],
          max: 5,
        }"
      />
    </NuxtLayout>
  </div>
</template>

<style>
/* 전역 너비 고정 및 줄바꿈 허용 (절대 숨기지 않음) */
* {
  box-sizing: border-box;
}

html,
body,
#__nuxt {
  width: 100%;
  max-width: 100vw;
  overflow-x: auto; /* 필요시 스크롤 허용 */
  margin: 0;
  padding: 0;
}

/* 긴 텍스트 강제 줄바꿈 (절대 숨기지 않음) */
body {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* pre, code 블록 - 줄바꿈 허용 */
pre,
code {
  max-width: 100%;
  overflow-x: auto;
  word-wrap: break-word;
  white-space: pre-wrap;
}

/* 테이블 - 스크롤 허용 */
table {
  max-width: 100%;
  overflow-x: auto;
  display: block;
}

/* 이미지 너비 제한 */
img {
  max-width: 100%;
  height: auto;
}

/* 텍스트는 절대 숨기지 않고 줄바꿈 */
p,
span,
div,
a,
button,
input,
textarea {
  word-break: break-word;
  overflow-wrap: break-word;
}
</style>
