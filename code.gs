/* ------------------------------------------------------
   SMARTWORK – Google Apps Script (Final NFE Edition)
   Host: pamornpong.sakda@gmail.com
--------------------------------------------------------- */

// ★★ โฟลเดอร์และชีตของพี่เจษ ★★
const ROOT_FOLDER_ID = "1jiQYfji-VlLhLmyEsk1MN0K7dTlW19cQ"; // โฟลเดอร์หลัก
const IMAGES_FOLDER_ID = "1hZv_-rMStHjNOYgD1fxa7KqGa6E6ZKqE"; // โฟลเดอร์ภาพ
const SPREADSHEET_ID = "1q51m8sRIGUTh_tFmLUgLMPDQf9YXFUwIJMF6VV5VEJM";
const SHEET_NAME = "portfolio_data";

/* ======================================================
   1) doGet – ใช้สำหรับ index.html
      คืนข้อมูลเป็น JSON
====================================================== */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: "Sheet not found: " + SHEET_NAME })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const values = sheet.getDataRange().getValues();
    const data = [];

    // แถวที่ 1 เป็น header → เริ่มที่ i = 1
    for (let i = 1; i < values.length; i++) {
      const r = values[i];
      data.push({
        name: r[0] || "",
        pos: r[1] || "",
        unit: r[2] || "",
        workDate: r[3] || "",
        title: r[4] || "",
        detail: r[5] || "",
        indicator: r[6] || "",
        url: r[7] || "",
        pics: r[8] ? JSON.parse(r[8]) : [],
        timestamp: r[9] || "",
      });
    }

    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "ERROR", message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/* ======================================================
   2) doPost – บันทึกข้อมูลจาก form.html
      พร้อมอัปโหลดรูปภาพ (Base64)
====================================================== */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Sheet not found: " + SHEET_NAME);

    const imgFolder = DriveApp.getFolderById(IMAGES_FOLDER_ID);

    // รับข้อมูลจาก form
    const name = payload.name || "";
    const pos = payload.pos || "";
    const unit = payload.unit || "";
    const workDate = payload.workDate || "";
    const title = payload.title || "";
    const detail = payload.detail || "";
    const indicator = payload.indicator || "";
    const url = payload.url || "";
    const picsBase64 = payload.pics || [];

    const savedUrls = [];

    /* -------------------------------------------
       2.1 อัปโหลดรูปภาพขึ้น Google Drive
    ------------------------------------------- */
    picsBase64.forEach((b64, index) => {
      if (!b64) return;

      const base64String = b64.split(",")[1]; // ตัด prefix data:image/jpeg
      const bytes = Utilities.base64Decode(base64String);

      const contentType = "image/jpeg";

      // สร้างชื่อไฟล์จากวันที่ + ชื่องาน
      const safeTitle = (title || "work")
        .substring(0, 40)
        .replace(/[\\/:*?"<>|]/g, "_");

      const fileName = `${workDate || "nodate"}_${safeTitle}_${index + 1}.jpg`;
      const file = imgFolder.createFile(bytes, fileName, contentType);

      savedUrls.push(file.getUrl());
    });

    /* -------------------------------------------
       2.2 บันทึกข้อมูลลง Google Sheet
    ------------------------------------------- */
    const timestamp = Utilities.formatDate(
      new Date(),
      "Asia/Bangkok",
      "yyyy-MM-dd HH:mm:ss"
    );

    sheet.appendRow([
      name,
      pos,
      unit,
      workDate,
      title,
      detail,
      indicator,
      url,
      JSON.stringify(savedUrls),
      timestamp,
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "OK" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "ERROR", message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
