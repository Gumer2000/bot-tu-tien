const express = require('express');
const server = express();

server.all('/', (req, res) => {
  res.send('Bot đang chạy!');
});

function keepAlive() {
  const PORT = process.env.PORT || Math.floor(Math.random() * (65535 - 3001) + 3001);
  try {
    server.listen(PORT, () => {
      console.log(`Server đã sẵn sàng! Port: ${PORT}`);
    });
  } catch (err) {
    console.log('Không thể khởi động server trên port ' + PORT);
    // Thử port khác nếu port hiện tại bị lỗi
    keepAlive();
  }
}

module.exports = keepAlive; 
