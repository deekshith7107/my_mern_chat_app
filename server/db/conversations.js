const mongoose= require('mongoose');

const conversationSchema=new mongoose.Schema({
    members:{
        type:Array,
        required:true
    }

});


const conversation=mongoose.model('user_conversations',conversationSchema);


module.exports=conversation;