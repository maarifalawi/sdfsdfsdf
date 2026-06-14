const bcrypt = require('bcrypt');

bcrypt.hash('batikkami01', 10)
  .then(console.log);