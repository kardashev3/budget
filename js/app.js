/**
 * 🏠 우리집 가계부 - 메인 앱 로직 (토스 스타일)
 */

// 현재 선택된 주차
let selectedWeek = null;
let pieChart = null;
let trendChart = null;

// ============================================
// 유틸리티 함수
// ============================================

function formatCurrency(amount, showSign = false) {
    const formatted = Math.abs(amount).toLocaleString('ko-KR');
    if (showSign && amount < 0) return `-₩${formatted}`;
    if (showSign && amount > 0) return `+₩${formatted}`;
    return `₩${formatted}`;
}

function getCategoryType(category) {
    if (category.startsWith('투자소득')) return 'income';
    if (category.startsWith('고정비')) return 'fixed';
    if (category.startsWith('변동비')) return 'variable';
    return 'variable';
}

function getCategorySubtype(category) {
    const parts = category.split('_');
    return parts.length > 1 ? parts[1] : category;
}

function getCategoryIcon(subtype) {
    const icons = {
        '식비': '🍽️',
        '기타': '📦',
        '교통비': '🚗',
        '대출이자': '🏦',
        '정기구독': '📱',
        '보험': '🛡️',
        '용돈': '💵'
    };
    return icons[subtype] || '💰';
}

function getCategoryColor(subtype) {
    const colors = {
        '식비': '#FF6B35',
        '기타': '#8B5CF6',
        '교통비': '#4ECDC4',
        '대출이자': '#6366F1',
        '정기구독': '#EC4899',
        '보험': '#10B981',
        '용돈': '#F59E0B'
    };
    return colors[subtype] || '#6366F1';
}

// ============================================
// 데이터 계산 함수
// ============================================

function getUniqueWeeks() {
    return [...new Set(accountingData.map(item => item.week))].sort((a, b) => a - b);
}

function getWeekData(week) {
    return accountingData.filter(item => item.week === week);
}

function calculateWeekTotal(week) {
    const data = getWeekData(week);
    let total = 0;
    data.forEach(item => {
        if (!getCategoryType(item.category).includes('income')) {
            total += item.amount;
        }
    });
    return total;
}

function calculateWeekComparison(currentWeek) {
    const weeks = getUniqueWeeks();
    const currentIndex = weeks.indexOf(currentWeek);

    if (currentIndex <= 0) {
        return { diff: 0, percent: 0, hasPrevious: false };
    }

    const prevWeek = weeks[currentIndex - 1];
    const currentTotal = calculateWeekTotal(currentWeek);
    const prevTotal = calculateWeekTotal(prevWeek);

    if (prevTotal === 0) {
        return { diff: currentTotal, percent: 100, hasPrevious: true };
    }

    const diff = currentTotal - prevTotal;
    const percent = ((diff / prevTotal) * 100).toFixed(1);

    return { diff, percent: parseFloat(percent), hasPrevious: true };
}

function calculateCategoryBreakdown(week = null) {
    const data = week ? getWeekData(week) : accountingData;
    const categories = {};
    let total = 0;

    data.forEach(item => {
        const type = getCategoryType(item.category);
        if (type === 'income') return;

        const subtype = getCategorySubtype(item.category);
        if (!categories[subtype]) {
            categories[subtype] = 0;
        }
        categories[subtype] += item.amount;
        total += item.amount;
    });

    // 비율 계산 및 정렬
    const result = Object.entries(categories)
        .map(([name, amount]) => ({
            name,
            amount,
            percent: total > 0 ? ((amount / total) * 100).toFixed(1) : 0,
            icon: getCategoryIcon(name),
            color: getCategoryColor(name)
        }))
        .sort((a, b) => b.amount - a.amount);

    return { categories: result, total };
}

function calculateWeeklySummary() {
    const weeks = getUniqueWeeks();
    return weeks.map(week => {
        const data = getWeekData(week);
        let fixed = 0, variable = 0;

        data.forEach(item => {
            const type = getCategoryType(item.category);
            if (type === 'fixed') fixed += item.amount;
            else if (type === 'variable') variable += item.amount;
        });

        return { week, fixed, variable, total: fixed + variable };
    });
}

// ============================================
// UI 렌더링 함수
// ============================================

/**
 * 이번 달 전체 수입/지출/잔액 계산
 */
function calculateMonthlyTotal() {
    let income = 0;
    let expense = 0;

    accountingData.forEach(item => {
        const type = getCategoryType(item.category);
        if (type === 'income') {
            income += item.amount;
        } else {
            expense += item.amount;
        }
    });

    return { income, expense, balance: income - expense };
}

/**
 * 월간 요약 렌더링
 */
function renderMonthlySummary() {
    const { income, expense, balance } = calculateMonthlyTotal();

    document.getElementById('monthly-income').textContent = formatCurrency(income);
    document.getElementById('monthly-expense').textContent = formatCurrency(expense);

    const balanceEl = document.getElementById('monthly-balance');
    if (balance >= 0) {
        balanceEl.textContent = formatCurrency(balance);
        balanceEl.style.color = '#3182F6';
    } else {
        balanceEl.textContent = `-${formatCurrency(Math.abs(balance))}`;
        balanceEl.style.color = '#F04452';
    }
}

function renderSummary(week) {
    const total = calculateWeekTotal(week);
    const comparison = calculateWeekComparison(week);

    document.getElementById('current-week').textContent = `${week}주차`;
    document.getElementById('weekly-total').textContent = formatCurrency(total);

    const comparisonEl = document.getElementById('weekly-comparison');

    if (!comparison.hasPrevious) {
        comparisonEl.innerHTML = `<span class="comparison-badge neutral">첫 주차 데이터</span>`;
    } else if (comparison.percent > 0) {
        comparisonEl.innerHTML = `
            <span class="comparison-badge up">
                ▲ ${Math.abs(comparison.percent)}% 증가 (${formatCurrency(comparison.diff, true)})
            </span>
        `;
    } else if (comparison.percent < 0) {
        comparisonEl.innerHTML = `
            <span class="comparison-badge down">
                ▼ ${Math.abs(comparison.percent)}% 감소 (${formatCurrency(comparison.diff, true)})
            </span>
        `;
    } else {
        comparisonEl.innerHTML = `<span class="comparison-badge neutral">전주와 동일</span>`;
    }
}

function renderCategoryList(week) {
    const { categories, total } = calculateCategoryBreakdown(week);
    const weekData = getWeekData(week);
    const container = document.getElementById('category-list');

    document.getElementById('category-subtitle').textContent = `총 ${formatCurrency(total)}`;

    if (categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">지출 내역이 없습니다</div>
            </div>
        `;
        return;
    }

    // 카테고리별 거래 내역 그룹핑
    const getTransactionsByCategory = (categoryName) => {
        return weekData.filter(item => {
            const type = getCategoryType(item.category);
            if (type === 'income') return false;
            return getCategorySubtype(item.category) === categoryName;
        }).sort((a, b) => {
            // 날짜 내림차순
            const dateA = a.date.replace(/\. /g, '-');
            const dateB = b.date.replace(/\. /g, '-');
            return dateB.localeCompare(dateA);
        });
    };

    container.innerHTML = categories.map((cat, index) => {
        const transactions = getTransactionsByCategory(cat.name);
        const transactionCount = transactions.length;

        // 상세 내역 HTML
        const detailsHtml = transactions.map(item => {
            const dateParts = item.date.split('. ');
            const displayDate = `${dateParts[1]}/${dateParts[2]}`;
            return `
                <div class="detail-item">
                    <div class="detail-info">
                        <div class="detail-note">${item.note || cat.name}</div>
                        <div class="detail-date">${displayDate}</div>
                    </div>
                    <div class="detail-amount">-${formatCurrency(item.amount)}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="category-item" data-category="${cat.name}">
                <div class="category-header" onclick="toggleCategory(this)">
                    <div class="category-icon" style="background: ${cat.color}20">
                        ${cat.icon}
                    </div>
                    <div class="category-info">
                        <div class="category-name-row">
                            <span class="category-name">${cat.name}</span>
                            <span class="category-count">${transactionCount}건</span>
                        </div>
                        <div class="category-bar-container">
                            <div class="category-bar" style="width: ${cat.percent}%; background: ${cat.color}"></div>
                        </div>
                    </div>
                    <div class="category-values">
                        <div class="category-amount">${formatCurrency(cat.amount)}</div>
                        <div class="category-percent">${cat.percent}%</div>
                    </div>
                    <span class="category-arrow">▼</span>
                </div>
                <div class="category-details">
                    ${detailsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// 카테고리 토글 함수
function toggleCategory(headerEl) {
    const categoryItem = headerEl.closest('.category-item');
    categoryItem.classList.toggle('expanded');
}

function renderPieChart(week) {
    const { categories } = calculateCategoryBreakdown(week);
    const ctx = document.getElementById('category-pie-chart');

    if (!ctx) return;

    // 기존 차트 제거
    if (pieChart) {
        pieChart.destroy();
    }

    if (categories.length === 0) return;

    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.name),
            datasets: [{
                data: categories.map(c => c.amount),
                backgroundColor: categories.map(c => c.color),
                borderWidth: 0,
                cutout: '65%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1A1A1A',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: 'Pretendard', size: 13 },
                    bodyFont: { family: 'Pretendard', size: 12 },
                    callbacks: {
                        label: (context) => {
                            const percent = categories[context.dataIndex].percent;
                            return ` ${formatCurrency(context.raw)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderTrendChart() {
    const weeklyData = calculateWeeklySummary();
    const ctx = document.getElementById('weekly-trend-chart');

    if (!ctx) return;

    // 기존 차트 제거
    if (trendChart) {
        trendChart.destroy();
    }

    Chart.defaults.font.family = 'Pretendard';

    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.map(d => `${d.week}주차`),
            datasets: [
                {
                    label: '고정비',
                    data: weeklyData.map(d => d.fixed),
                    backgroundColor: '#6366F1',
                    borderRadius: 6,
                    barThickness: 20
                },
                {
                    label: '변동비',
                    data: weeklyData.map(d => d.variable),
                    backgroundColor: '#F59E0B',
                    borderRadius: 6,
                    barThickness: 20
                },
                {
                    label: '총 지출',
                    data: weeklyData.map(d => d.total),
                    type: 'line',
                    borderColor: '#3182F6',
                    backgroundColor: 'transparent',
                    borderWidth: 3,
                    pointBackgroundColor: '#3182F6',
                    pointRadius: 5,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: '#1A1A1A',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 12, weight: '600' } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#F0F1F4' },
                    ticks: {
                        font: { size: 11 },
                        callback: (value) => {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000) + 'K';
                            return value;
                        }
                    }
                }
            }
        }
    });
}

function renderTransactions(week) {
    const data = getWeekData(week);
    const container = document.getElementById('transaction-list');

    // 최근 순 정렬 (날짜 내림차순)
    const sorted = [...data].sort((a, b) => {
        const dateA = a.date.replace(/\. /g, '-').replace(/ /g, '');
        const dateB = b.date.replace(/\. /g, '-').replace(/ /g, '');
        return dateB.localeCompare(dateA);
    });

    document.getElementById('transaction-count').textContent = `${sorted.length}건`;

    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">거래 내역이 없습니다</div>
            </div>
        `;
        return;
    }

    // 최대 10개만 표시
    const displayed = sorted.slice(0, 10);

    container.innerHTML = displayed.map(item => {
        const type = getCategoryType(item.category);
        const subtype = getCategorySubtype(item.category);
        const isIncome = type === 'income';
        const dateParts = item.date.split('. ');
        const displayDate = `${dateParts[1]}/${dateParts[2]}`;

        return `
            <div class="transaction-item">
                <div class="transaction-icon">${getCategoryIcon(subtype)}</div>
                <div class="transaction-info">
                    <div class="transaction-note">${item.note || subtype}</div>
                    <div class="transaction-date">${displayDate} · ${subtype}</div>
                </div>
                <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(item.amount)}
                </div>
            </div>
        `;
    }).join('');
}

function renderWeekTabs() {
    const weeks = getUniqueWeeks();
    const container = document.getElementById('week-tabs');

    container.innerHTML = weeks.map(week => `
        <button class="week-tab ${week === selectedWeek ? 'active' : ''}" data-week="${week}">
            ${week}주차
        </button>
    `).join('');

    // 이벤트 리스너
    container.querySelectorAll('.week-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectedWeek = parseInt(tab.dataset.week);
            renderAll();
        });
    });
}

function renderAll() {
    if (!selectedWeek) return;

    renderMonthlySummary();
    renderSummary(selectedWeek);
    renderCategoryList(selectedWeek);
    renderPieChart(selectedWeek);
    renderTrendChart();
    renderWeekTabs();
}

// ============================================
// 앱 초기화
// ============================================

async function initApp() {
    // 데이터 로딩
    await fetchAccountingData();

    // 가장 최근 주차 선택
    const weeks = getUniqueWeeks();
    if (weeks.length > 0) {
        selectedWeek = weeks[weeks.length - 1];
    }

    // 렌더링
    renderAll();
}

// DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', initApp);
