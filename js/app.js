/**
 * 🏠 우리집 가계부 - 메인 앱 로직 (토스 스타일)
 */

// 현재 선택된 주차
let selectedWeek = null;
let monthlyPieChart = null;
let weeklyPieChart = null;
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

// ============================================
// UI 렌더링 함수
// ============================================

/**
 * 월간 섹션 렌더링
 */
function renderMonthlySection() {
    // 수입/지출/잔액
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

    // 카테고리 breakdown (전체 월간)
    const { categories, total } = calculateCategoryBreakdown(null);
    document.getElementById('monthly-category-total').textContent = `총 ${formatCurrency(total)}`;

    const container = document.getElementById('monthly-category-list');
    container.innerHTML = categories.map(cat => `
        <div class="category-item" data-category="${cat.name}">
            <div class="category-header" onclick="toggleCategory(this)">
                <div class="category-icon" style="background: ${cat.color}20">
                    ${cat.icon}
                </div>
                <div class="category-info">
                    <div class="category-name-row">
                        <span class="category-name">${cat.name}</span>
                    </div>
                    <div class="category-bar-container">
                        <div class="category-bar" style="width: ${cat.percent}%; background: ${cat.color}"></div>
                    </div>
                </div>
                <div class="category-values">
                    <div class="category-amount">${formatCurrency(cat.amount)}</div>
                    <div class="category-percent">${cat.percent}%</div>
                </div>
            </div>
        </div>
    `).join('');

    // 월간 파이 차트
    renderPieChart('monthly-pie-chart', categories, 'monthly');
}

/**
 * 주간 섹션 렌더링
 */
function renderWeeklySection(week) {
    // 주간 지출 요약
    const total = calculateWeekTotal(week);
    const comparison = calculateWeekComparison(week);

    document.getElementById('current-week').textContent = `${week}주차`;
    document.getElementById('weekly-total').textContent = formatCurrency(total);

    const comparisonEl = document.getElementById('weekly-comparison');
    if (!comparison.hasPrevious) {
        comparisonEl.innerHTML = `<span class="comparison-badge neutral">첫 주차 데이터</span>`;
    } else if (comparison.percent > 0) {
        comparisonEl.innerHTML = `<span class="comparison-badge up">▲ ${Math.abs(comparison.percent)}% 증가</span>`;
    } else if (comparison.percent < 0) {
        comparisonEl.innerHTML = `<span class="comparison-badge down">▼ ${Math.abs(comparison.percent)}% 감소</span>`;
    } else {
        comparisonEl.innerHTML = `<span class="comparison-badge neutral">전주와 동일</span>`;
    }

    // 주간 카테고리 breakdown
    const { categories, total: weekTotal } = calculateCategoryBreakdown(week);
    const weekData = getWeekData(week);
    document.getElementById('weekly-category-total').textContent = `총 ${formatCurrency(weekTotal)}`;

    const container = document.getElementById('weekly-category-list');

    // 카테고리별 거래 내역 그룹핑
    const getTransactionsByCategory = (categoryName) => {
        return weekData.filter(item => {
            const type = getCategoryType(item.category);
            if (type === 'income') return false;
            return getCategorySubtype(item.category) === categoryName;
        }).sort((a, b) => {
            const dateA = a.date.replace(/\. /g, '-');
            const dateB = b.date.replace(/\. /g, '-');
            return dateB.localeCompare(dateA);
        });
    };

    container.innerHTML = categories.map(cat => {
        const transactions = getTransactionsByCategory(cat.name);
        const transactionCount = transactions.length;

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

    // 주간 파이 차트
    renderPieChart('weekly-pie-chart', categories, 'weekly');
}

/**
 * 파이 차트 렌더링
 */
function renderPieChart(canvasId, categories, type) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // 기존 차트 제거
    if (type === 'monthly' && monthlyPieChart) {
        monthlyPieChart.destroy();
    } else if (type === 'weekly' && weeklyPieChart) {
        weeklyPieChart.destroy();
    }

    if (categories.length === 0) return;

    const chart = new Chart(ctx, {
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

    if (type === 'monthly') {
        monthlyPieChart = chart;
    } else {
        weeklyPieChart = chart;
    }
}

/**
 * 주차별 추이 차트 렌더링
 */
function renderTrendChart() {
    const weeklyData = calculateWeeklySummary();
    const ctx = document.getElementById('weekly-trend-chart');

    if (!ctx) return;

    if (trendChart) {
        trendChart.destroy();
    }

    Chart.defaults.font.family = 'Pretendard';

    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.map(d => `${d.week}주`),
            datasets: [
                {
                    label: '고정비',
                    data: weeklyData.map(d => d.fixed),
                    backgroundColor: '#6366F1',
                    borderRadius: 6,
                    barThickness: 16
                },
                {
                    label: '변동비',
                    data: weeklyData.map(d => d.variable),
                    backgroundColor: '#F59E0B',
                    borderRadius: 6,
                    barThickness: 16
                },
                {
                    label: '총계',
                    data: weeklyData.map(d => d.total),
                    type: 'line',
                    borderColor: '#3182F6',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: '#3182F6',
                    pointRadius: 4,
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
                        padding: 12,
                        font: { size: 10, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: '#1A1A1A',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11, weight: '600' } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#F0F1F4' },
                    ticks: {
                        font: { size: 10 },
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

// 카테고리 토글 함수
function toggleCategory(headerEl) {
    const categoryItem = headerEl.closest('.category-item');
    categoryItem.classList.toggle('expanded');
}

function renderWeekTabs() {
    const weeks = getUniqueWeeks();
    const container = document.getElementById('week-tabs');

    container.innerHTML = weeks.map(week => `
        <button class="week-tab ${week === selectedWeek ? 'active' : ''}" data-week="${week}">
            ${week}주차
        </button>
    `).join('');

    container.querySelectorAll('.week-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectedWeek = parseInt(tab.dataset.week);
            renderAll();
        });
    });
}

function renderAll() {
    if (!selectedWeek) return;

    renderMonthlySection();
    renderWeeklySection(selectedWeek);
    renderTrendChart();
    renderWeekTabs();
}

// ============================================
// 앱 초기화
// ============================================

async function initApp() {
    await fetchAccountingData();

    const weeks = getUniqueWeeks();
    if (weeks.length > 0) {
        selectedWeek = weeks[weeks.length - 1];
    }

    renderAll();
}

document.addEventListener('DOMContentLoaded', initApp);
