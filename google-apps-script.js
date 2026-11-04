/**
 * UNBREAKABLE PHOENIX — Google Apps Script для збереження заявок у Google Таблицю
 *
 * ІНСТРУКЦІЯ З НАЛАШТУВАННЯ (займає 2 хвилини):
 * 1. Відкрийте або створіть нову таблицю на https://sheets.google.com
 * 2. У верхньому меню оберіть: «Розширення» (Extensions) -> «Apps Script»
 * 3. Видаліть весь код за замовчуванням та вставте весь вміст цього файлу.
 * 4. Натисніть синю кнопку «Розгорнути» (Deploy) вгорі праворуч -> «Нове розгортання» (New deployment).
 * 5. Натисніть на шестерню біля «Виберіть тип» -> оберіть «Веб-програма» (Web app).
 * 6. Заповніть поля:
 *    - Опис: «Phoenix Applications API»
 *    - Виконувати від імені (Execute as): «Я» (Me - ваш акаунт)
 *    - Хто має доступ (Who has access): «Будь-хто» (Anyone) — ОБОВ'ЯЗКОВО!
 * 7. Натисніть «Розгорнути» (Deploy) та підтвердьте дозволи акаунта Google.
 * 8. Скопіюйте отриманий «URL-адреса веб-програми» (Web App URL, що закінчується на /exec).
 * 9. Вставте цей URL у файл .env або налаштування Vercel як змінну:
 *    VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 */

// Вставте сюди ID вашої Google Таблиці (якщо запускаєте окремий скрипт через script.google.com).
// Якщо скрипт відкрито через «Розширення -> Apps Script» усередині таблиці — можна залишити порожнім.
var SPREADSHEET_ID = "";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = getOrCreateSheet();
    var data = {};

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var timestamp = new Date();
    var formattedDate = Utilities.formatDate(timestamp, "Europe/Kyiv", "yyyy-MM-dd HH:mm:ss");

    var row = [
      formattedDate,
      data.id || ("UP-" + Utilities.getUuid().slice(0, 8).toUpperCase()),
      data.name || "",
      data.course || "",
      data.email || "",
      data.telegram || "",
      data.campaignId || "direct",
      data.sourceLocation || "",
      data.userAgent || ""
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", id: data.id }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", service: "UNBREAKABLE PHOENIX Applications API" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  var ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  var sheetName = "Заявки";
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Якщо перший рядок порожній, створюємо шапку таблиці зі стилями
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Дата та час (Київ)",
      "ID заявки",
      "ПІБ / Ім'я",
      "Курс",
      "Email",
      "Telegram",
      "Джерело (Кампанія)",
      "Розділ (Кнопка)",
      "User-Agent"
    ];
    sheet.appendRow(headers);

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#111111");
    headerRange.setFontColor("#FFD700");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Roboto");

    sheet.setFrozenRows(1);

    // Автоматична ширина колонок
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}
