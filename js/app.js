/**
 * 🏠 우리집 가계부 - 메인 앱 로직
 * 
 * UI 렌더링 및 사용자 인터랙션을 담당합니다.
 */

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 숫자를 통화 형식으로 포맷팅
 * @param {number} amount - 금액
 * @returns {string} 포맷팅된 문자열
 */
function formatCurrency(amount) {
    return amount.toLocaleString('ko-KR') + '원';
}

/**
 * 카테고리 타입 추출 (고정비, 변동비, 투자소득)
 * @param {string} category - 카테고리 문자열
 * @returns {string} 타입 (income, fixed, variable)
 */
function getCategoryType(category) {
    if (category.startsWith('투자소득')) return 'income';
    if (category.startsWith('고정비')) return 'fixed';
    if (category.startsWith('변동비')) return 'variable';
    return 'variable';
}

/**
 * 카테고리 서브타입 추출
 * @param {string} category - 카테고리 문자열
 * @returns {string} 서브타입
 */
function getCategorySubtype(category) {
    const parts = category.split('_');
    return parts.length > 1 ? parts[1] : category;
}

// ============================================
// 데이터 계산 함수
// ============================================

/**
 * 전체 요약 계산
 * @returns {Object} 소득, 고정비, 변동비, 총액
 */
function calculateSummary() {
    let income = 0;
    let fixed = 0;
    let variable = 0;

    accountingData.forEach(item => {
        const type = getCategoryType(item.category);
        if (type === 'income') {
            income += item.amount;
        } else if (type === 'fixed') {
            fixed += item.amount;
        } else {
            variable += item.amount;
        }
    });

    return { income, fixed, variable, total: fixed + variable };
}

/**
 * 카테고리별 합계 계산
 * @returns {Object} 카테고리별 금액 및 타입
 */
function calculateByCategory() {
    const categories = {};

    accountingData.forEach(item => {
        const subtype = getCategorySubtype(item.category);
        const type = getCategoryType(item.category);

        if (type === 'income') return; // 소득은 제외

        if (!categories[subtype]) {
            categories[subtype] = { amount: 0, type };
        }
        categories[subtype].amount += item.amount;
    });

    return categories;
}

/**
 * 주차별 데이터 가져오기
 * @param {number} week - 주차
 * @returns {Array} 해당 주차 데이터
 */
function getWeekData(week) {
    return accountingData.filter(item => item.week === week);
}

/**
 * 고유 주차 목록 가져오기
 * @returns {Array} 주차 배열
 */
function getUniqueWeeks() {
    return [...new Set(accountingData.map(item => item.week))].sort();
}

/**
 * 주차별 합계 계산
 * @returns {Array} 주차별 요약 데이터
 */
function calculateWeeklySummary() {
    const weeks = getUniqueWeeks();
    return weeks.map(week => {
        const data = getWeekData(week);
        let fixed = 0;
        let variable = 0;
        let income = 0;

        data.forEach(item => {
            const type = getCategoryType(item.category);
            if (type === 'income') income += item.amount;
            else if (type === 'fixed') fixed += item.amount;
            else variable += item.amount;
        });

        return { week, fixed, variable, income, total: fixed + variable };
    });
}

// ============================================
// UI 렌더링 함수
// ============================================

/**
 * 요약 카드 렌더링
 */
function renderSummary() {
    const summary = calculateSummary();

    document.getElementById('income-total').textContent = formatCurrency(summary.income);
    document.getElementById('fixed-total').textContent = formatCurrency(summary.fixed);
    document.getElementById('variable-total').textContent = formatCurrency(summary.variable);
    document.getElementById('balance-total').textContent = formatCurrency(summary.total);
}

/**
 * 카테고리 그리드 렌더링
 */
function renderCategories() {
    const categories = calculateByCategory();
    const grid = document.getElementById('category-grid');
    const maxAmount = Math.max(...Object.values(categories).map(c => c.amount));

    // config에서 색상 가져오기 (없으면 기본값 사용)
    const colors = typeof CONFIG !== 'undefined' ? CONFIG.CATEGORY_COLORS : {
        '식비': '#f59e0b',
        '기타': '#8b5cf6',
        '교통비': '#06b6d4',
        '대출이자': '#6366f1',
        '정기구독': '#ec4899',
        '보험': '#10b981'
    };

    grid.innerHTML = Object.entries(categories)
        .sort((a, b) => b[1].amount - a[1].amount)
        .map(([name, data]) => {
            const percentage = (data.amount / maxAmount) * 100;
            const color = colors[name] || '#6366f1';

            return `
                <div class="glass-card category-card">
                    <div class="category-name">${name}</div>
                    <div class="category-amount">${formatCurrency(data.amount)}</div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${percentage}%; background: ${color}"></div>
                    </div>
                </div>
            `;
        }).join('');
}

/**
 * 주차 탭 렌더링
 */
function renderWeekTabs() {
    const weeks = getUniqueWeeks();
    const tabsContainer = document.getElementById('week-tabs');

    tabsContainer.innerHTML = weeks.map((week, index) => `
        <button class="week-tab ${index === 0 ? 'active' : ''}" data-week="${week}">
            ${week}주차
        </button>
    `).join('');

    // 탭 클릭 이벤트
    tabsContainer.querySelectorAll('.week-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.week-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTransactions(parseInt(tab.dataset.week));
        });
    });
}

/**
 * 거래 내역 렌더링
 * @param {number} week - 주차
 */
function renderTransactions(week) {
    const transactions = getWeekData(week);
    const tbody = document.getElementById('transactions-body');

    tbody.innerHTML = transactions.map(item => {
        const type = getCategoryType(item.category);
        const isIncome = type === 'income';
        const subtype = getCategorySubtype(item.category);

        return `
            <tr>
                <td>${item.date.split('. ').slice(1).join('/')}</td>
                <td>
                    <span class="category-badge ${type}">${subtype}</span>
                </td>
                <td class="amount-cell ${isIncome ? 'positive' : 'negative'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(item.amount)}
                </td>
                <td>${item.note}</td>
            </tr>
        `;
    }).join('');
}

/**
 * 주차별 차트 렌더링
 */
function renderWeeklyChart() {
    const weeklyData = calculateWeeklySummary();
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Chart.js 글로벌 설정
    Chart.defaults.font.family = "'Pretendard', sans-serif";
    Chart.defaults.color = 'rgba(255, 255, 255, 0.8)';

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.map(d => `${d.week}주차`),
            datasets: [
                {
                    label: '고정비',
                    data: weeklyData.map(d => d.fixed),
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: '변동비',
                    data: weeklyData.map(d => d.variable),
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 13, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 15,
                    titleFont: { size: 14, weight: '700' },
                    bodyFont: { size: 13 },
                    cornerRadius: 12,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString('ko-KR')}원`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 13, weight: '600' } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        font: { size: 12 },
                        callback: function (value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000) + 'K';
                            }
                            return value;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// 앱 초기화
// ============================================

/**
 * 앱 초기화 (비동기 - 구글 시트 데이터 로딩 지원)
 */
async function initApp() {
    // 구글 시트 데이터 로딩 시도
    await fetchAccountingData();

    // UI 렌더링
    renderSummary();
    renderCategories();
    renderWeeklyChart();
    renderWeekTabs();

    // 첫 번째 주차 데이터 표시
    const weeks = getUniqueWeeks();
    if (weeks.length > 0) {
        renderTransactions(weeks[0]);
    }

    // 자동 새로고침 설정 (config에서 설정된 경우)
    if (typeof CONFIG !== 'undefined' && CONFIG.AUTO_REFRESH_INTERVAL > 0) {
        setInterval(refreshData, CONFIG.AUTO_REFRESH_INTERVAL);
    }
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', initApp);
