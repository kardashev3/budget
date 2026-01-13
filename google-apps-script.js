/**
 * 🏠 우리집 가계부 - Google Apps Script
 * 
 * 사용 방법:
 * 1. 구글 시트에서 확장 프로그램 → Apps Script 클릭
 * 2. 이 코드를 복사하여 붙여넣기
 * 3. '배포' → '새 배포' 클릭
 * 4. 유형: '웹 앱' 선택
 * 5. 액세스 권한: '모든 사용자' 선택
 * 6. 배포 후 생성된 URL을 data.js의 SHEET_API_URL에 붙여넣기
 */

function doGet(e) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        const data = sheet.getDataRange().getValues();

        // 헤더 행 (첫 번째 행)
        const headers = data[0];

        // 데이터 행들을 객체 배열로 변환
        const jsonData = [];

        for (let i = 1; i < data.length; i++) {
            const row = data[i];

            // 빈 행 건너뛰기
            if (!row[0] && !row[1]) continue;

            // 금액에서 쉼표 제거하고 숫자로 변환
            let amount = row[3];
            if (typeof amount === 'string') {
                amount = parseInt(amount.replace(/,/g, ''), 10);
            }

            // 구분 필드에서 투자소득 여부 확인
            const category = row[2] || '';
            const isIncome = category.startsWith('투자소득');

            jsonData.push({
                week: row[0],           // 주차
                date: formatDate(row[1]), // 일자
                category: category,     // 구분
                amount: amount || 0,    // 금액
                note: row[4] || '',     // 비고
                isIncome: isIncome
            });
        }

        // CORS 헤더와 함께 JSON 반환
        const output = ContentService.createTextOutput(JSON.stringify({
            success: true,
            data: jsonData,
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

// 날짜 포맷팅 함수
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

// 테스트 함수 (Apps Script 에디터에서 실행 가능)
function testDoGet() {
    const result = doGet();
    Logger.log(result.getContent());
}
