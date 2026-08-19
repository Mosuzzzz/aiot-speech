# แบ็กเอนด์เสียง AIoT

แบ็กเอนด์ Express.js ขนาดเล็กสำหรับควบคุมและตรวจสอบสถานะการบันทึกเสียงของอุปกรณ์ AIoT โดยตั้งค่าให้ถอดเสียงและสรุปผลเป็นภาษาไทย

## สิ่งที่ต้องใช้

- Node.js 18 or newer
- npm

## ติดตั้ง

```bash
npm install
```

## เรียกใช้งาน

```bash
node server.js
```

เซิร์ฟเวอร์จะเริ่มทำงานที่ [http://localhost:8080](http://localhost:8080) ตามค่าเริ่มต้น

## API

### ตรวจสอบสถานะ

```http
GET /
```

ส่งหน้าเว็บของระบบกลับมา

### เริ่มบันทึกเสียง

```http
POST /api/start
```

### หยุดบันทึกเสียง

```http
POST /api/stop
```

### ตรวจสอบสถานะการบันทึก

```http
GET /api/status
```

ตัวอย่างคำตอบ:

```json
{
  "recording": true
}
```

## ตัวอย่างคำขอ

```bash
curl -X POST http://localhost:8080/api/start
curl -X POST http://localhost:8080/api/stop
curl http://localhost:8080/api/status
```

## หมายเหตุ

สถานะการบันทึกเสียงถูกเก็บไว้ในหน่วยความจำและจะรีเซ็ตเมื่อเริ่มเซิร์ฟเวอร์ใหม่
