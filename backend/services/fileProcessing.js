const ExcelJS = require('exceljs');

async function extractTextFromExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  let result = '';
  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      const rowValues = row.values;
      // شروع از ایندکس 1 چون اولین مقدار خالی است
      for (let i = 1; i < rowValues.length; i++) {
        if (rowValues[i]) {
          result += rowValues[i] + ' ';
        }
      }
      result += '\n';
    });
    result += '\n\n';
  });
  
  return result;
}

module.exports = { extractTextFromExcel };