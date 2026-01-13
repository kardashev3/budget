/**
 * 🏠 우리집 가계부 - 설정 파일
 * 
 * 구글 시트 연동 및 앱 설정을 관리합니다.
 */

const CONFIG = {
    // 앱 정보
    APP_NAME: '우리집 가계부',
    APP_VERSION: '1.0.0',

    // 현재 표시할 월/년도
    DISPLAY_YEAR: 2026,
    DISPLAY_MONTH: 1,

    /**
     * 구글 시트 API URL
     * 
     * 설정 방법:
     * 1. 구글 시트 → 확장 프로그램 → Apps Script
     * 2. google-apps-script.js 코드 복사/붙여넣기
     * 3. 배포 → 새 배포 → 웹 앱 선택
     * 4. 액세스 권한: '모든 사용자' 선택
     * 5. 배포 후 생성된 URL을 아래에 붙여넣기
     * 
     * 예시: 'https://script.google.com/macros/s/xxx.../exec'
     * 빈 문자열('')이면 샘플 데이터 사용
     */
    SHEET_API_URL: 'https://script.google.com/macros/s/AKfycbwIRpxjoRwsz1AjLUqpxkz5XQ0GvGfcKPO1PgPHuI4a9pZtCcL-kHBng9pYqfflUnbndA/exec',

    // 카테고리 색상
    CATEGORY_COLORS: {
        '식비': '#f59e0b',
        '기타': '#8b5cf6',
        '교통비': '#06b6d4',
        '대출이자': '#6366f1',
        '정기구독': '#ec4899',
        '보험': '#10b981',
        '용돈': '#14b8a6'
    },

    // 자동 새로고침 간격 (밀리초, 0이면 비활성화)
    AUTO_REFRESH_INTERVAL: 0
};

// 설정 freeze (수정 방지)
Object.freeze(CONFIG);
Object.freeze(CONFIG.CATEGORY_COLORS);

