# 서울대 지박령 스터디

참가자는 출석부와 랭킹을 조회하고, 관리자만 로그인 후 출석 체크·취소를 할 수 있습니다.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/abcdahyun/snu-jibak-study)

## 배포

위 버튼을 눌러 Cloudflare 계정으로 로그인합니다. 배포 화면에서 `ADMIN_PASSWORD`에 관리자만 알고 있는 **20자 이상의 무작위 비밀번호**를 입력하세요. 실제 비밀번호는 소스 코드에 넣지 않습니다. 기본 비밀번호는 없습니다. 비밀번호가 없거나 너무 짧으면 출석 변경은 차단됩니다.

이 버튼은 저장소를 복사하고 Worker와 D1 데이터베이스를 생성합니다. 생성되는 저장소 이름은 현재 저장소와 다른 이름(예: `snu-jibak-study-live`)을 사용하세요. 이후 수정 사항은 배포에 연결된 저장소에 반영해야 합니다.

- Build command: `npm run build`
- Deploy command: `npm run deploy`
- DB 마이그레이션은 deploy 명령에 포함됩니다.
- `wrangler.jsonc`의 0으로 채운 database_id는 배포 버튼이 실제 ID로 바꾸는 자리표시자입니다. 직접 CLI 배포 시에는 실제 D1 ID를 입력해야 합니다.

기존 저장소를 그대로 연결하려면 Cloudflare Workers & Pages에서 GitHub 저장소를 가져오고, D1을 생성하여 설정의 database_id를 실제 ID로 바꾼 다음 위 명령을 사용합니다. `ADMIN_PASSWORD`는 Worker의 암호화된 Secret으로 설정하세요.

## 관리자 권한

- 관리자 비밀번호는 서버 Secret에만 보관합니다.
- 서버가 모든 출석 변경 요청의 로그인 세션을 검사합니다.
- 세션은 8시간 후 만료하며 Secure/HttpOnly/SameSite 쿠키를 사용합니다.
- 로그아웃은 서버 세션도 삭제합니다. 비밀번호 변경 시 기존 세션도 무효화됩니다.
- 로그인 시도는 IP별 분당 5회로 제한합니다.
- 참가자용 회원가입이나 관리자 권한 부여 기능은 없습니다.
- 출석부와 랭킹(이름만 포함)은 공개 조회용입니다.

## 개발 및 검증

Node.js 22.13 이상이 필요합니다. `npm install` 후 `.dev.vars.example`을 `.dev.vars`로 복사하고 로컬 관리자 비밀번호를 설정하세요.

```sh
npm test
npm run build
npm run dev
```

원본 Sites 프로젝트와 로컬 출석 DB, 인증정보는 업로드하지 않습니다. 새 Cloudflare 데이터베이스의 출석 기록은 빈 상태로 시작합니다.

공식 배포 안내: https://developers.cloudflare.com/workers/platform/deploy-buttons/
