const express=require('express');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cors=require('cors');
const {Server} =require('socket.io');
const http=require('http');
const path = require('path');


const app=express();
const port=3000;
const serverport=8001;


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());
const server=http.createServer(app);
const io=new Server(server,{
    cors:{
        origin:"http://localhost:3001",
    }
});


// Serve static files from the React app
// app.use(express.static(path.join(__dirname, 'client/build')));

//userechema
const users=require('./db/users.js');
const conversations=require('./db/conversations.js');
const messages=require('./db/messages.js');







let userss = [];

io.on('connection', async (socket) => {
    // console.log("User connected", socket.id);

    socket.on('addUser', (userId) => {
        if (!userId) {
            console.error("User ID is null or undefined");
            return;
        }

        socket.userId = userId;
        // console.log("User ID:", userId);

        const userExists = userss.find(user => user.userId === userId);
        if (!userExists) {
            const user = { userId: userId, socketId: socket.id };
            userss.push(user);
            io.emit('getUser', userss);
        }
        // console.log("Users:", userss);
    });

    socket.on('sendMessage', async (data) => {
        // console.log("Incoming data:", data);

        if (!data.recid || !data.senderid) {
            console.error("Receiver ID or Sender ID is null or undefined");
            return;
        }

        const receiver = userss.find(user => user.userId === data.recid);
        const sender = userss.find(user => user.userId === data.senderid);

        // console.log("Receiver:", receiver);
        // console.log("Sender:", sender);

        const convoid = await conversations.findOne({ member: { $all: [data.senderid, data.recid] } }, '_id');

        if (sender) {
            const senderDetails = await users.findById(data.senderid, "name email");
            if (data.senderid !== data.recid) {
                // console.log("con"+data.convoid);
                io.to(sender.socketId).emit('getMessage', { userd: senderDetails, message: data.message, convoid: data.convoid });
            }
        }

        if (receiver) {
            const senderDetails = await users.findById(data.senderid, "name email");
            io.to(receiver.socketId).emit('getMessage', { userd: senderDetails, message: data.message, convoid: data.convoid });
        }
    });

    socket.on('disconnect', () => {
        // console.log("User disconnected", socket.id);
        userss = userss.filter(user => user.socketId !== socket.id);
        io.emit('getUser', userss);
    });
});







//bd connection
require('./db/connection.js');



// Authorization Middleware
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        console.log("Access denied, no token provided");
        return res.status(401).json({ error: 'Access denied, no token provided' });
    }

    try {
        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'this is secret key';
        const verified = jwt.verify(token, JWT_SECRET_KEY);
        req.user = verified;
        console.log("authencation successful");
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};






// signup
app.post('/api/signup', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Please enter valid details' });
        } else {
            const userExist = await users.findOne({ email: email });
            if (userExist) {
                return res.status(400).json({ error: 'User already exists' });
            } else {
                const hashpassword = await bcrypt.hash(password, 10);
                const user = new users({ name: name, email: email, password: hashpassword });
                await user.save();
                
                return res.status(201).json({ message: 'User created successfully' });
            }
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});



// signin
app.post('/api/signin', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter valid details' });
        } else {
            const validuser = await users.findOne({ email: email });
            if (!validuser) {
                return res.status(404).json({ error: 'User does not exist' });
            } else {
                const passwordmatch = await bcrypt.compare(password, validuser.password);

                if (!passwordmatch) {
                    return res.status(401).json({ error: 'Password is incorrect' });
                }

                const payload = {
                    _id: validuser._id,
                    email: validuser.email,
                };

                const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'this is secret key';
                const token = await jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '24h' });

                validuser.token = token;

                await validuser.save();

                return res.status(200).json({
                    _id: validuser._id,
                    name: validuser.name,
                    email: validuser.email,
                    token: validuser.token,
                });
            }
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});




//conversations set
app.post('/api/conversation',authenticateToken,async (req, res)=>{
    try {
        const {senderid,receiverid}=req.body;
        const conversation=new conversations({members:[senderid,receiverid]});
        await conversation.save();
        // console.log(conversation);
        res.status(200).send("Success");
    } catch (error) {
        res.status(500).send("server error: " + error.message);
    }
    
})

// conversation get
// Get conversations of a user
app.get('/api/conversation/:userid',authenticateToken, async (req, res) => {
    try {
      const userid = req.params.userid;
      const conversation = await conversations.find({ members: { $in: [userid] } });
    //   console.log(conversation);
  
      const conversationuserdatapromise = conversation.map(async (conversation) => {
        const receiverid = conversation.members.find((member) => member !== userid) || userid;
        // console.log(receiverid);
        const usersdata = await users.findById(receiverid, 'name email');
        return { usersdata, conversationid: conversation._id };
      });
  
      const conversationuserdata = await Promise.all(conversationuserdatapromise);
      res.status(200).json(conversationuserdata);
    } catch (error) {
      res.status(500).send("Server error: " + error.message);
    }
  });
  


// message post
app.post('/api/message',authenticateToken,async (req, res)=>{
    try {
        const {conversationid,senderid, message,receiverid}=req.body;
        if(!senderid || !message){
            return res.status(404).send('Please enter valid details');
        }
        if(conversationid==='new' && receiverid){
            const conversation=new conversations({members:[senderid,receiverid]});
            await conversation.save();
            const messagesend=new messages({conversation_id:conversation._id,sender_id:senderid,message:message});
            await messagesend.save();
            // console.log(conversation);
            // console.log(messagesend);
            return res.status(200).send({convoid:conversation._id});
            
        }else if(!receiverid){
            return res.status(400).send("please fill required fields");
            
        }
        const messagesend=new messages({conversation_id:conversationid,sender_id:senderid,message:message});

        await messagesend.save();
        res.status(200).send({convoid:'success'});
    } catch (error) {
        res.status(500).send('server error: ' + error.message);
    }
});

//coversationmessages get
app.get('/api/message/:conversationid',authenticateToken, async (req, res) => {
    try {
        const conversationid=req.params.conversationid;
        if(conversationid=='new') {
            return res.status(200).json([]);
        }

        const messagedb=await messages.find({conversation_id:conversationid});
        const conversationdetailspromise=messagedb.map(async (message)=>{
            const userd=await users.findById(message.sender_id,"name email");
            return {userd,message:message.message};
        });
        const conversationdetails=await Promise.all(conversationdetailspromise);
        // console.log(conversationdetails);
        res.status(200).json(conversationdetails);
    } catch (error) {
        console.log(error);
        res.status(500).send("server error: " + error.message);
    }
});


//getting available users
app.get('/api/users',authenticateToken,async (req, res)=>{
    try {
        const availableUsers=await users.find({},'_id name email');
        res.status(200).json(availableUsers);

    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});





// app.get('/', (req,res)=>{

//     // res.send("Welcome");
// });




// Catch all other routes and return the React app
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
//   });

server.listen(serverport,()=>{
    console.log(`server is running on port ${serverport}`);
});


app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
});


