# ADR-001: Next.js 16 proxy 파일 컨벤션

- **날짜**: 2026-03-03
- **상태**: Accepted

## Context

Next.js 16으로 업그레이드 후 개발 서버 실행 시 다음 경고가 출력됐다:

```
⚠ The "middleware" file convention is deprecated.
  Please use "proxy" instead.
  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

기존에는 프로젝트 루트에 `middleware.ts` 파일로 인증 라우팅(로그인 리다이렉트, 보호 경로, 온보딩 분기)을 처리했다.

## Decision

`middleware.ts`를 `proxy.ts`로 이름 변경한다. 파일 내용(인증 로직)은 그대로 유지한다.

```
루트/middleware.ts  →  루트/proxy.ts
```

## Consequences

- 경고 메시지 제거
- 파일 내 코드 변경 없음 — 순수한 파일 컨벤션 변경
- Next.js 16+ 에서는 `proxy.ts`가 표준. `middleware.ts`는 하위 호환 경고를 출력하다가 이후 버전에서 제거될 예정
