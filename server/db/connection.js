const mongoose = require('mongoose');
const url="mongodb://localhost:27017/my_chat_database";

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{
    console.log('Connected to mongobd'); 
});

