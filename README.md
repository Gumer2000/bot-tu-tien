# Bot Tu Tiên

Discord bot game về tu tiên với nhiều tính năng thú vị.

## Tính Năng

### Hệ Thống Boss
- 3 loại boss: Huyết Nguyệt Ma Vương, Thiên Ngoại Tà Tiên, Cổ Tiên Thánh Thú
- Mỗi người chơi được đánh boss 3 lần
- Boss cần 10 lần tấn công để hạ gục
- Phần thưởng đặc biệt cho người kết liễu boss

### Cooldown Các Hoạt Động
- PvP: 5 phút/lần
- Bí kíp: 30 phút/lần
- Tu luyện: 1 giờ/lần
- Dược viên: 30 phút/lần
- Linh thú: 24 giờ/lần
- Bí cảnh: 24 giờ/lần

## Cài Đặt

1. Clone repository:
```bash
git clone https://github.com/Gumer2000/bot-tu-tien.git
cd bot-tu-tien
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env với nội dung:
```
TOKEN=your_discord_bot_token_here
MONGODB_URI=your_mongodb_connection_string_here
```

4. Chạy bot:
```bash
npm start
```

## Triển Khai trên Replit

1. Import từ GitHub vào Replit
2. Thêm Secret với key là "TOKEN" và value là token của bot
3. Chạy lệnh `npm install` trong Shell
4. Click nút Run để khởi động bot

## Liên Hệ

Nếu có bất kỳ câu hỏi hoặc góp ý nào, vui lòng tạo issue trên GitHub. 