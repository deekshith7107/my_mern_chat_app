const mongoose= require('mongoose');

const userschema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:true
        },
        token:{
            type:String,
        }
    }
);

const user=mongoose.model('users',userschema);

module.exports=user;