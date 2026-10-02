# 오목 한 판

HTML, CSS, JavaScript만 사용한 15×15 웹 오목 게임입니다.

## 지원 모드
- **1인용:** 사용자(흑돌) vs AI(백돌)
- **2인용:** 같은 기기에서 흑돌/백돌 번갈아 플레이

## AI 동작
AI는 다음 순서로 착수합니다.

1. 바로 승리할 수 있는 수가 있으면 착수
2. 상대가 다음 수에 승리할 수 있으면 차단
3. 연속된 돌의 길이, 열린 방향, 중앙과의 거리 등을 점수화해 가장 유리한 위치 선택

완전한 탐색형 AI는 아니지만 일반적인 웹 미니게임 수준에서 공격과 방어를 수행합니다.

## 기능
- 15×15 오목판
- 1인용 / 2인용 모드 전환
- AI 대전
- 가로 / 세로 / 대각선 승리 판정
- 마지막 수 표시
- 승리 연결선 표시
- 무르기
- 새 게임
- 모바일 / 데스크톱 반응형
- GitHub Pages 정적 배포 지원

## 실행
`index.html`을 브라우저에서 열면 바로 실행됩니다.

## GitHub 업로드
```bash
git init
git add .
git commit -m "Create omok game with AI mode"
git branch -M main
git remote add origin https://github.com/사용자이름/저장소이름.git
git push -u origin main
```

## GitHub Pages 배포
1. 저장소 `Settings`
2. `Pages`
3. `Build and deployment`
4. Source: `Deploy from a branch`
5. Branch: `main`
6. Folder: `/(root)`
7. `Save`

보통 배포 주소는 아래 형식입니다.

```text
https://사용자이름.github.io/저장소이름/
```

## 규칙
현재는 자유 오목 방식입니다.
- 5개 이상 연속이면 승리
- 3-3, 4-4, 장목 금수는 적용하지 않음
