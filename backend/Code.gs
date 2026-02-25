// .gs ファイル
// このコードをGoogle Apps Scriptの Code.gs に貼り付けてください。

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_NAME_MEMBERS = 'Members';
const SHEET_NAME_TRAININGS = 'Trainings';

// 初期セットアップ：シートが存在しない場合に作成し、ヘッダーを設定する
function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Members Sheet
  let mSheet = ss.getSheetByName(SHEET_NAME_MEMBERS);
  if (!mSheet) {
    mSheet = ss.insertSheet(SHEET_NAME_MEMBERS);
    mSheet.appendRow(['id', 'json_data']); // A列: ID, B列: JSONデータ
  }

  // Trainings Sheet
  let tSheet = ss.getSheetByName(SHEET_NAME_TRAININGS);
  if (!tSheet) {
    tSheet = ss.insertSheet(SHEET_NAME_TRAININGS);
    tSheet.appendRow(['id', 'json_data']); // A列: ID, B列: JSONデータ
  }
}

/**
 * GETリクエストを処理する関数
 * フロントエンドに会員データと研修データをJSONで返却します
 */
function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Membersの取得
  const mSheet = ss.getSheetByName(SHEET_NAME_MEMBERS);
  const mRows = mSheet ? mSheet.getDataRange().getValues() : [];
  const members = [];
  
  // 1行目はヘッダーなのでスキップ
  for (let i = 1; i < mRows.length; i++) {
    const jsonCell = mRows[i][1];
    if (jsonCell) {
      try {
        members.push(JSON.parse(jsonCell));
      } catch (err) {
        console.error('Error parsing member JSON at row ' + (i+1));
      }
    }
  }

  // Trainingsの取得
  const tSheet = ss.getSheetByName(SHEET_NAME_TRAININGS);
  const tRows = tSheet ? tSheet.getDataRange().getValues() : [];
  const trainings = [];
  
  for (let i = 1; i < tRows.length; i++) {
    const jsonCell = tRows[i][1];
    if (jsonCell) {
      try {
        trainings.push(JSON.parse(jsonCell));
      } catch (err) {
        console.error('Error parsing training JSON at row ' + (i+1));
      }
    }
  }

  const result = {
    status: 'success',
    data: {
      members: members,
      trainings: trainings
    }
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POSTリクエストを処理する関数
 * データの更新を行います
 */
function doPost(e) {
  // CORS対策: text/plainで送られてくることを想定してパース
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return createErrorResponse('Invalid JSON format');
  }

  const action = payload.action;

  if (action === 'UPDATE_MEMBER') {
    const member = payload.member;
    if (!member || !member.id) {
      return createErrorResponse('Member ID is missing');
    }
    updateMember(member);
    return createSuccessResponse('Member updated successfully');
  }
  
  // 将来的に研修データの更新アクションなどをここに追加可能
  
  return createErrorResponse('Unknown action: ' + action);
}

/**
 * メンバー情報をシートに保存（更新または新規追加）
 */
function updateMember(member) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME_MEMBERS);
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName(SHEET_NAME_MEMBERS);
  }

  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;

  // 既存データの検索
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(member.id)) {
      rowIndex = i + 1; // 配列インデックス -> 行番号
      break;
    }
  }

  const jsonString = JSON.stringify(member);

  if (rowIndex > 0) {
    // 更新
    sheet.getRange(rowIndex, 2).setValue(jsonString);
  } else {
    // 新規追加
    sheet.appendRow([member.id, jsonString]);
  }
}

function createSuccessResponse(message) {
  const output = { status: 'success', message: message };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message) {
  const output = { status: 'error', message: message };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}