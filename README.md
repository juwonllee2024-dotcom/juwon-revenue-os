# Juwon Revenue OS

미용·웰니스 소상공인의 주문을 웹사이트, 쇼츠 4개, SNS 문구, 승인, 납품 ZIP, 포트폴리오 사례로 바꾸는 로컬 운영체제입니다.

## 실행

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run dev
```

브라우저에서 `http://127.0.0.1:10640`을 엽니다.

## 첫 고객 흐름

1. 매장명, 업종, 대표 서비스, 연락처, 예약 링크를 입력합니다.
2. `자동 제작 시작`을 눌러 웹사이트와 쇼츠 기획 4개를 생성합니다.
3. 결과물을 검수하고 `승인 요청`을 누릅니다.
4. 승인자가 현재 결과물 해시를 확인하고 최종 승인합니다.
5. `납품 패키지 만들기`로 체크섬 목록, ZIP, 사례 페이지를 생성합니다.

## 안전한 데모

개발 서버를 실행한 상태에서 다음 명령을 사용합니다.

```powershell
npm.cmd run rehearse
```

데모는 가상 매장만 생성하며 승인 대기 상태에서 멈춥니다. 외부 게시, 결제, 메시지 발송은 실행하지 않습니다.

## 검증

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run e2e
```

## 기존 프로젝트 연결

Company OS는 `http://127.0.0.1:4877`의 상태만 읽습니다. 기존 Company OS 파일과 데이터는 수정하지 않습니다. Remotion 명령은 `BeautyShort` 구성과 주문별 결과 폴더만 허용하며 MVP에서는 자동 외부 게시를 하지 않습니다.
