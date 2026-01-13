/**
 * 🏠 우리집 가계부 - 데이터 모듈
 * 
 * 구글 시트 연동 및 데이터 관리를 담당합니다.
 * 설정은 config.js의 CONFIG.SHEET_API_URL을 사용합니다.
 */

// 샘플 데이터 (구글 시트 연동 전 테스트용)
const SAMPLE_DATA = [
    { week: 1, date: '2026. 1. 1', category: '변동비_식비', amount: 15000, note: '배달' },
    { week: 1, date: '2026. 1. 2', category: '고정비_대출이자', amount: 1043262, note: '주담대 원리금' },
    { week: 1, date: '2026. 1. 2', category: '변동비_식비', amount: 27900, note: '배달' },
    { week: 1, date: '2026. 1. 2', category: '변동비_식비', amount: 6190, note: '식재료' },
    { week: 1, date: '2026. 1. 2', category: '변동비_기타', amount: 20000, note: '대희 속옷' },
    { week: 2, date: '2026. 1. 4', category: '변동비_기타', amount: 83715, note: '정수기 필터' },
    { week: 2, date: '2026. 1. 4', category: '변동비_식비', amount: 18000, note: '외식' },
    { week: 2, date: '2026. 1. 4', category: '고정비_기타', amount: 400000, note: '지영 용돈' },
    { week: 2, date: '2026. 1. 5', category: '변동비_식비', amount: 11980, note: '식재료' },
    { week: 2, date: '2026. 1. 6', category: '변동비_식비', amount: 16000, note: '식재료' },
    { week: 2, date: '2026. 1. 6', category: '변동비_식비', amount: 48980, note: '식재료' },
    { week: 2, date: '2026. 1. 7', category: '투자소득_기타', amount: 1219, note: '이자', isIncome: true },
    { week: 2, date: '2026. 1. 7', category: '변동비_식비', amount: 50000, note: '외식' },
    { week: 2, date: '2026. 1. 7', category: '변동비_교통비', amount: 800, note: '주차' },
    { week: 2, date: '2026. 1. 7', category: '고정비_정기구독', amount: 9116, note: 'X 구독료' },
    { week: 2, date: '2026. 1. 8', category: '변동비_기타', amount: 240, note: '인쇄' },
    { week: 2, date: '2026. 1. 8', category: '변동비_식비', amount: 5000, note: '간식' },
    { week: 2, date: '2026. 1. 8', category: '변동비_식비', amount: 5750, note: '간식' },
    { week: 2, date: '2026. 1. 9', category: '변동비_식비', amount: 4900, note: '간식' },
    { week: 2, date: '2026. 1. 9', category: '변동비_기타', amount: 2500, note: '약국' },
    { week: 2, date: '2026. 1. 9', category: '변동비_식비', amount: 22000, note: '외식' },
    { week: 2, date: '2026. 1. 9', category: '변동비_식비', amount: 3800, note: '간식' },
    { week: 2, date: '2026. 1. 10', category: '변동비_식비', amount: 13000, note: '간식' },
    { week: 2, date: '2026. 1. 10', category: '변동비_식비', amount: 29000, note: '외식' },
    { week: 2, date: '2026. 1. 10', category: '변동비_식비', amount: 5200, note: '간식' },
    { week: 2, date: '2026. 1. 10', category: '고정비_보험', amount: 60520, note: '자차 보험' },
    { week: 3, date: '2026. 1. 11', category: '투자소득_기타', amount: 3746, note: '이자', isIncome: true },
    { week: 3, date: '2026. 1. 11', category: '변동비_식비', amount: 3000, note: '간식' },
    { week: 3, date: '2026. 1. 11', category: '변동비_식비', amount: 49230, note: '식재료' },
    { week: 3, date: '2026. 1. 11', category: '변동비_식비', amount: 23300, note: '배달' }
];

// 전역 데이터 변수
let accountingData = [...SAMPLE_DATA];
let lastUpdated = null;

/**
 * 구글 시트에서 데이터 가져오기
 * @returns {Promise<Array>} 가계부 데이터 배열
 */
async function fetchAccountingData() {
    const apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.SHEET_API_URL : '';

    // API URL이 설정되지 않은 경우 샘플 데이터 사용
    if (!apiUrl) {
        console.log('📊 샘플 데이터를 사용합니다. 구글 시트 연동은 config.js의 SHEET_API_URL을 설정하세요.');
        accountingData = [...SAMPLE_DATA];
        return accountingData;
    }

    try {
        showLoadingState(true);

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (result.success && result.data) {
            accountingData = result.data;
            lastUpdated = result.lastUpdated;
            console.log('✅ 구글 시트 데이터 로드 완료:', accountingData.length, '건');
            updateLastUpdatedDisplay();
            return accountingData;
        } else {
            throw new Error(result.error || '데이터 로드 실패');
        }
    } catch (error) {
        console.error('❌ 구글 시트 연동 오류:', error);
        console.log('📊 샘플 데이터로 대체합니다.');
        accountingData = [...SAMPLE_DATA];
        return accountingData;
    } finally {
        showLoadingState(false);
    }
}

/**
 * 로딩 상태 표시
 * @param {boolean} isLoading - 로딩 중 여부
 */
function showLoadingState(isLoading) {
    const header = document.querySelector('.header');
    if (!header) return;

    let loadingEl = header.querySelector('.loading-indicator');

    if (isLoading) {
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'loading-indicator';
            loadingEl.innerHTML = '🔄 데이터 로딩 중...';
            loadingEl.style.cssText = 'font-size: 0.9rem; color: rgba(255,255,255,0.7); margin-top: 10px;';
            header.appendChild(loadingEl);
        }
    } else {
        if (loadingEl) {
            loadingEl.remove();
        }
    }
}

/**
 * 마지막 업데이트 시간 표시
 */
function updateLastUpdatedDisplay() {
    if (!lastUpdated) return;

    const footer = document.querySelector('.footer p');
    if (footer) {
        const date = new Date(lastUpdated);
        const timeStr = date.toLocaleString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        footer.innerHTML = `Made with 💕 for our family · 마지막 동기화: ${timeStr}`;
    }
}

/**
 * 데이터 새로고침 (수동 동기화용)
 */
async function refreshData() {
    await fetchAccountingData();

    // 앱 다시 렌더링
    if (typeof initApp === 'function') {
        // 차트 초기화를 위해 캔버스 재생성
        const chartContainer = document.querySelector('.chart-card');
        if (chartContainer) {
            chartContainer.innerHTML = '<canvas id="weekly-chart"></canvas>';
        }
        initApp();
    }
}
