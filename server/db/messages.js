const mongoose= require('mongoose');

const messagesSchema=new mongoose.Schema({
    conversation_id:{
        type:String,
        required:true
    },
    sender_id:{
        type:String,
    },
    message:{
        type:String,
    }

});


const messages=mongoose.model('user_messages', messagesSchema);


module.exports=messages;