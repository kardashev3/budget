# 🏠 우리집 가계부

가족과 함께 공유하는 아름다운 가계부 웹 앱입니다.

![가계부 스크린샷](./assets/screenshot.png)

## ✨ 주요 기능

- 📊 **대시보드**: 투자소득, 고정비, 변동비, 총 지출 한눈에 보기
- 📈 **차트**: 주차별 지출 추이 시각화
- 🏷️ **카테고리**: 식비, 교통비, 보험 등 카테고리별 분석
- 📅 **주차별 내역**: 상세 거래 내역 확인
- 🔄 **구글 시트 연동**: 실시간 데이터 동기화 지원

## 🎨 디자인

- **Glassmorphism** 디자인
- **Pretendard** 한글 폰트
- 반응형 레이아웃 (모바일/태블릿/데스크톱)

## 📁 프로젝트 구조

```
accounting/
├── index.html              # 메인 HTML
├── css/
│   └── style.css          # 스타일시트
├── js/
│   ├── config.js          # 설정 파일 (API URL 등)
│   ├── data.js            # 데이터 모듈
│   └── app.js             # 앱 로직
├── google-apps-script.js   # 구글 시트 연동용 Apps Script
└── README.md
```

## 🚀 GitHub Pages 배포

1. GitHub에 새 저장소 생성
2. 코드 업로드:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Settings → Pages → Source: `main` 브랜치 선택
4. 몇 분 후 `https://YOUR_USERNAME.github.io/YOUR_REPO/` 에서 확인!

## 🔗 구글 시트 연동 방법

### 1. Apps Script 설정

1. 구글 시트 열기
2. **확장 프로그램** → **Apps Script**
3. `google-apps-script.js` 내용 복사/붙여넣기
4. **배포** → **새 배포** → **웹 앱** 선택
5. 액세스 권한: **모든 사용자**
6. 배포 후 URL 복사

### 2. 웹 앱에 URL 연결

`js/config.js` 파일에서:

```javascript
SHEET_API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
```

### 3. 구글 시트 형식

| 주차 | 일자 | 구분 | 금액 | 비고 |
|------|------|------|------|------|
| 1 | 2026. 1. 1 | 변동비_식비 | 15000 | 배달 |
| 1 | 2026. 1. 2 | 고정비_대출이자 | 1043262 | 주담대 원리금 |

## 📱 사용 방법

1. 웹사이트 접속
2. **🔄 동기화** 버튼으로 최신 데이터 불러오기
3. 주차별 탭으로 상세 내역 확인

## 🛠️ 기술 스택

- HTML5 / CSS3 / JavaScript (ES6+)
- [Chart.js](https://www.chartjs.org/) - 차트 라이브러리
- [Pretendard](https://github.com/orioncactus/pretendard) - 한글 폰트
- Google Apps Script - 시트 API

## 📄 라이선스

MIT License - 자유롭게 사용하세요! 💕
