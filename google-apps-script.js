/**
 * 🏠 우리집 가계부 - Google Apps Script
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
 * |------|------|------|------|------|
 * | 1    | 2026. 1. 1 | 변동비_식비 | 15000 | 배달 |
 */

// 설정: 워크시트 이름
const SHEET_NAME = 'Log';

function doGet(e) {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);

        if (!sheet) {
            throw new Error(`'${SHEET_NAME}' 워크시트를 찾을 수 없습니다.`);
        }

        const data = sheet.getDataRange().getValues();

        // 헤더 행 (1행): 주차, 일자, 구분, 금액, 비고
        const headers = data[0];

        // 컬럼 인덱스 확인
        const colIndex = {
            week: headers.indexOf('주차'),
            date: headers.indexOf('일자'),
            category: headers.indexOf('구분'),
            amount: headers.indexOf('금액'),
            note: headers.indexOf('비고')
        };

        // 데이터 행들을 객체 배열로 변환 (2행부터)
        const jsonData = [];

        for (let i = 1; i < data.length; i++) {
            const row = data[i];

            // 빈 행 건너뛰기 (주차와 일자가 모두 없으면 스킵)
            if (!row[colIndex.week] && !row[colIndex.date]) continue;

            // 금액 처리 (쉼표 제거 및 숫자 변환)
            let amount = row[colIndex.amount];
            if (typeof amount === 'string') {
                amount = parseInt(amount.replace(/,/g, ''), 10);
            }

            // 구분 필드에서 투자소득 여부 확인
            const category = row[colIndex.category] || '';
            const isIncome = category.startsWith('투자소득');

            jsonData.push({
                week: row[colIndex.week],
                date: formatDate(row[colIndex.date]),
                category: category,
                amount: amount || 0,
                note: row[colIndex.note] || '',
                isIncome: isIncome
            });
        }

        // CORS 헤더와 함께 JSON 반환
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

/**
 * 날짜 포맷팅 함수
 * @param {Date|string} dateValue - 날짜 값
 * @returns {string} 포맷팅된 날짜 문자열
 */
function formatDate(dateValue) {
    if (!dateValue) return '';

    // 이미 문자열인 경우
    if (typeof dateValue === 'string') {
        return dateValue;
    }

    // Date 객체인 경우
    if (dateValue instanceof Date) {
        const year = dateValue.getFullYear();
        const month = dateValue.getMonth() + 1;
        const day = dateValue.getDate();
        return `${year}. ${month}. ${day}`;
    }

    return String(dateValue);
}

/**
 * 테스트 함수 (Apps Script 에디터에서 실행 가능)
 * 실행 후 콘솔(View > Logs)에서 결과 확인
 */
function testDoGet() {
    const result = doGet();
    Logger.log(result.getContent());
}
