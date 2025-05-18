const express = require('express');
const server = express();

server.all('/', (req, res) => {
  res.send('Bot đang chạy!');
});

function keepAlive() {
  server.listen(3000, () => {
    console.log('Server sẵn sàng!');
  });
}

module.exports = keepAlive; 