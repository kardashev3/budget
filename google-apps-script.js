/**
 * 🏠 우리집 가계부 - Google Apps Script
 * 
 * 기능:
 * 1. 가계부 데이터를 JSON API로 제공
 * 2. 비고 값을 기반으로 구분을 자동 분류
 * 
 * 사용 방법:
 * 1. 구글 시트에서 확장 프로그램 → Apps Script 클릭
 * 2. 이 코드를 복사하여 붙여넣기
 * 3. '배포' → '새 배포' 클릭
 * 4. 유형: '웹 앱' 선택
 * 5. 액세스 권한: '모든 사용자' 선택
 * 6. 배포 후 생성된 URL을 config.js의 SHEET_API_URL에 붙여넣기
 * 
 * 시트 구조 (Log 워크시트):
 * | 주차 | 일자 | 구분 | 금액 | 비고 |
 */

// ============================================
// 설정
// ============================================
const SHEET_NAME = 'Log';

// 자동 분류 규칙: 비고에 포함된 키워드 → 구분 값
const AUTO_CATEGORY_RULES = {
    // 식비
    '변동비_식비': [
        '배달', '외식', '식재료', '간식', '마트', '편의점', '카페', '커피',
        '점심', '저녁', '아침', '밥', '치킨', '피자', '햄버거', '분식',
        '반찬', '과일', '음료', '빵', '디저트', '아이스크림', '술', '맥주'
    ],
    // 교통비
    '변동비_교통비': [
        '주차', '주유', '기름', '택시', '버스', '지하철', '교통', '톨비',
        '하이패스', '자동차', '정비', '세차', '타이어'
    ],
    // 기타 변동비
    '변동비_기타': [
        '약국', '병원', '의료', '인쇄', '문구', '선물', '옷', '속옷',
        '신발', '가방', '화장품', '미용', '헤어', '필터', '세탁', '청소'
    ],
    // 고정비 - 용돈
    '고정비_기타': [
        '용돈', '생활비'
    ],
    // 고정비 - 대출
    '고정비_대출이자': [
        '대출', '원리금', '주담대', '이자', '상환'
    ],
    // 고정비 - 보험
    '고정비_보험': [
        '보험'
    ],
    // 고정비 - 구독
    '고정비_정기구독': [
        '구독', '넷플릭스', 'Netflix', '유튜브', 'YouTube', 'X ', '스포티파이',
        '멜론', '정기', '월정액'
    ],
    // 투자소득
    '투자소득_기타': [
        '이자', '배당', '수익', '입금', '환급'
    ]
};

// ============================================
// API 엔드포인트
// ============================================
function doGet(e) {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);

        if (!sheet) {
            throw new Error(`'${SHEET_NAME}' 워크시트를 찾을 수 없습니다.`);
        }

        const data = sheet.getDataRange().getValues();
        const headers = data[0];

        // 컬럼 인덱스 확인
        const colIndex = {
            week: headers.indexOf('주차'),
            date: headers.indexOf('일자'),
            category: headers.indexOf('구분'),
            amount: headers.indexOf('금액'),
            note: headers.indexOf('비고')
        };

        const jsonData = [];

        for (let i = 1; i < data.length; i++) {
            const row = data[i];

            // 빈 행 건너뛰기
            if (!row[colIndex.week] && !row[colIndex.date]) continue;

            // 금액 처리
            let amount = row[colIndex.amount];
            if (typeof amount === 'string') {
                amount = parseInt(amount.replace(/,/g, ''), 10);
            }

            const note = row[colIndex.note] || '';
            let category = row[colIndex.category] || '';

            // 구분이 비어있으면 자동 분류
            if (!category && note) {
                category = autoClassify(note);
            }

            const isIncome = category.startsWith('투자소득');

            jsonData.push({
                week: row[colIndex.week],
                date: formatDate(row[colIndex.date]),
                category: category,
                amount: amount || 0,
                note: note,
                isIncome: isIncome
            });
        }

        const output = ContentService.createTextOutput(JSON.stringify({
            success: true,
            data: jsonData,
            count: jsonData.length,
            lastUpdated: new Date().toISOString()
        }));
        output.setMimeType(ContentService.MimeType.JSON);

        return output;

    } catch (error) {
        const output = ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.message
        }));
        output.setMimeType(ContentService.MimeType.JSON);
        return output;
    }
}

// ============================================
// 자동 분류 함수
// ============================================

/**
 * 비고 값을 분석하여 구분을 자동으로 결정
 * @param {string} note - 비고 값
 * @returns {string} 구분 값
 */
function autoClassify(note) {
    const noteLower = note.toLowerCase();

    for (const [category, keywords] of Object.entries(AUTO_CATEGORY_RULES)) {
        for (const keyword of keywords) {
            if (noteLower.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    // 기본값: 변동비_기타
    return '변동비_기타';
}

/**
 * 시트의 빈 구분 값을 자동으로 채우는 함수
 * 메뉴에서 수동으로 실행 가능
 */
function autoFillCategories() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
        SpreadsheetApp.getUi().alert(`'${SHEET_NAME}' 워크시트를 찾을 수 없습니다.`);
        return;
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const colIndex = {
        category: headers.indexOf('구분'),
        note: headers.indexOf('비고')
    };

    let updatedCount = 0;

    for (let i = 1; i < data.length; i++) {
        const category = data[i][colIndex.category];
        const note = data[i][colIndex.note];

        // 구분이 비어있고 비고가 있으면 자동 분류
        if (!category && note) {
            const newCategory = autoClassify(note);
            sheet.getRange(i + 1, colIndex.category + 1).setValue(newCategory);
            updatedCount++;
        }
    }

    SpreadsheetApp.getUi().alert(`${updatedCount}개의 항목이 자동 분류되었습니다.`);
}

/**
 * 커스텀 메뉴 추가
 */
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('🏠 가계부')
        .addItem('📝 빈 구분 자동 채우기', 'autoFillCategories')
        .addItem('🧪 테스트', 'testDoGet')
        .addToUi();
}

// ============================================
// 유틸리티 함수
// ============================================

function formatDate(dateValue) {
    if (!dateValue) return '';

    if (typeof dateValue === 'string') {
        return dateValue;
    }

    if (dateValue instanceof Date) {
        const year = dateValue.getFullYear();
        const month = dateValue.getMonth() + 1;
        const day = dateValue.getDate();
        return `${year}. ${month}. ${day}`;
    }

    return String(dateValue);
}

function testDoGet() {
    const result = doGet();
    Logger.log(result.getContent());
}
