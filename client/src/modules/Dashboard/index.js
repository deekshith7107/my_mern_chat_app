import React, { useEffect } from "react";
import Avatar from "../../assets/gamer.png";
import callicon from "../../assets/callicon.png";
import Input from "../../components/index.js";
import sendicon from "../../assets/send.png";
import { useState } from "react";
import Button from "../../components/butt.js";


import { useNavigate } from "react-router-dom";

import { io } from "socket.io-client";

import {useRef} from "react";

const Dashboard = () => {

  
  //searching availusers
  const [search, setSearch] = useState("");

  //for looging out
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const navigate = useNavigate();

  const [user, setuser] = useState(
    JSON.parse(localStorage.getItem("user:details"))
  );

  const [message, setmessage] = useState([]);

  const [messagepopup, setmessagepopup] = useState([]);
  const [curconvoid, setcurconvoid] = useState("");

  const [sendmessage, setsendmessage] = useState({
    convoid: null,
    recid: null,
    message: "",
    name: "",
    email: "",
  });

  const [conversation, setconversation] = useState([]);

  const [socket, setsocket] = useState(null);

  const [availableusers, setavailableusers] = useState([{}]);


  //for scrolling
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [message]);

  useEffect(() => {
    const newSocket = io("http://localhost:8001");
    setsocket(newSocket);
    // console.log(socket);
    return () => newSocket.close();
  }, []);

  // useEffect(() => {
  //   console.log("curstate", messagepopup);
  // }, [messagepopup]);
  useEffect(() => {
    // console.log(socket);
    if (socket) {
      if (user._id) {
        socket.emit("addUser", user._id);
      }
      socket.on("getUser", (users) => {
        // console.log('active user',users);
      });

      socket.on("getMessage", (data) => {
        // console.log("messages", data);

        const { convoid, userd, message } = data;

        // Create the objects as needed
        const conmess = { convoid, message };
        const remdetails = { userd, message };
        const localconvoid = localStorage.getItem("user:convo");
        // console.log("comess" + conmess.convoid);
        // console.log("curcon" + curconvoid);
        // console.log("localconvo" + localconvoid);

        if (localconvoid === convoid) {
          setmessage((prevstate) => {
            // console.log("prevstate", prevstate);
            if (prevstate) {
              return [...prevstate, remdetails];
            }
            return [remdetails];
          });
        } else {
          setmessagepopup((prevstate) => {
            return [...prevstate, conmess];
          });
        }
      });
    }
  }, [socket]);

  const handlemessage = async (convoid, receviersdata) => {
    try {
      // console.log("receviersdata :",receviersdata);
      const res = await fetch(`http://localhost:3000/api/message/${convoid}`, {
        cache: "no-cache",
        method: "get",
        headers: {
          "Content-Type": "application/json",
          "Authorization":"Bearer "+localStorage.getItem("user:token")
        },
      });
      const data = await res.json();
      // console.log("retriving messages :",data);
      setmessage(data);
      localStorage.setItem("user:convo", convoid);
      setmessagepopup((prevstate) => {
        return prevstate.filter((state) =>  localStorage.getItem("user:convo")!== state.convoid);
      });      
      
      // console.log("sendmessage convoid 1  " + convoid);
      // console.log("cur state in handle message"+messagepopup);
      setsendmessage((prevstate) => {
        return {
          ...prevstate,
          convoid: convoid,
          recid: receviersdata._id,
          name: receviersdata.name,
          email: receviersdata.email,
        };
      });
      // console.log("sendmessage in opening chat :",sendmessage);
    } catch (error) {
      // console.log(error);
      alert(error.message);
    }
  };

  const handleSendMessage = async (convoid, recid, message) => {
    try {
      socket.emit("sendMessage", {
        convoid: convoid,
        recid: recid,
        message: message,
        senderid: user._id,
      });
      // console.log("sendmessage in before sending message :",sendmessage);

      // setcurconvoid(convoid);
      // console.log("sendmessage convoid" + convoid);
      const res = await fetch(`http://localhost:3000/api/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":"Bearer "+localStorage.getItem("user:token")
        },
        body: JSON.stringify({
          conversationid: convoid,
          senderid: user._id,
          receiverid: recid,
          message: message,
        }),
      });

      const resdata = await res.json();
      if (resdata.convoid === "success") {
        setsendmessage((prevstate) => ({
          ...prevstate,
          message: "",
        }));
      } else {
        setsendmessage((prevstate) => ({
          ...prevstate,
          convoid: resdata.convoid,
          message: "",
        }));
      }

      // console.log("res after sending message :",res.body);

      // console.log("sendmessage in after sending message :", sendmessage);
    } catch (error) {
      // console.log(error);
      alert(error);
    }
  };

  useEffect(() => {
    const fetchavailableusers = async () => {
      const res = await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization":"Bearer "+localStorage.getItem("user:token")
        },
      });
      const resdata = await res.json();
      // console.log("avausers  :",resdata);
      setavailableusers((prevstate) => ({
        ...prevstate,
        resdata,
      }));
    };
    fetchavailableusers();
  }, []);

  //getting conversation of users (left side all users) mean previous conversation
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/conversation/${user._id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization":"Bearer "+localStorage.getItem("user:token")
            },
          }
        );
        const conversationData = await res.json();
        setconversation(conversationData);
        // console.log(conversationData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchConversation();
  }, [message]);

  //getting conversation of available users (right side users) in the world
  useEffect(() => {
    const fetchusers = async () => {
      try {
        // console.log(localStorage.getItem("user:token"));
        const res = await fetch("http://localhost:3000/api/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization":"Bearer "+localStorage.getItem("user:token")
          },
        });
        const resdata = await res.json();
        // console.log("res", resdata);

        const filterAvailableUsers = resdata.filter((user) => {
          // console.log("Checking user:", user);
          // console.log("conversation",conversation);
          return !conversation.some((con) => {
            //  console.log("Inside:", con, "User ID:", user._id, "Con User ID:", con.usersdata._id);
            return con.usersdata._id === user._id;
          });
        });

        // console.log("filterwed", filterAvailableUsers);

        setavailableusers(filterAvailableUsers);
      } catch (error) {
        console.log("available users fetch error", error);
      }
    };
    fetchusers();
  }, [conversation, message]);

  // console.log("user datta",user);
  return (
    <div className="bg-gray-100 h-screen flex items-center">
      <div className="bg-gray-600 h-screen border w-[20%] overflow-scroll">
        <div className=" bg-yellow-100 cursor-pointer grid grid-cols-6 gap-2 pl-3 pt-3 h-[13%] w-[100%] ">
          <img
            src={Avatar}
            alt="avatar"
            className="col-span-2 w-[100px] h-[70px] rounded-full p-1"
          />
          <div className="col-span-3  ">
            <div className="font-bold text-gray-800">{user.name}</div>
            <h1 className="text-gray-600">{user.email}</h1>
          </div>
        </div>
        <hr />
        <div>
          <div className="font-bold text-red-400">Messages</div>
          {conversation.map(({ conversationid, usersdata }, index) => {
            return (
              <div key={index}>
                <div className="grid grid-cols-4 gap-2 m-3">
                  <img
                    src={Avatar}
                    alt="avatar"
                    className="cursor-pointer col-span-1  rounded-full p-1"
                  />
                  <div
                    className="cursor-pointer col-span-3 "
                    onClick={() => {
                      handlemessage(conversationid, usersdata);
                    }}
                  >
                    <div className="font-bold text-gray-800">
                      {usersdata.name}
                    </div>
                    <h1 className="text-gray-600">{usersdata.email}</h1>
                    <div className="text-red-500">
                      <div className="text-red-500">
                        {messagepopup.map(({ convoid, message }, index) => {
                          if (convoid === conversationid) {
                            // console.log("match"+message);

                            return <div key={index}>{message}</div>;
                          } else {
                            // console.log("not a match");
                            return null;
                          }
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <hr />
              </div>
            );
          })}
        </div>
      </div>

      {/* this is middle part */}
      <div className="h-screen border w-[60%] flex flex-col">
        <div className="cursor-pointer grid grid-cols-12 gap-1 h-[13%] p-3 border border-gray-950 rounded-e-md bg-gray-600 items-center">
          <img
            src={Avatar}
            alt="avatar"
            className="col-span-2 w-[70px] h-[70px] rounded-full p-1"
          />
          <div className="col-span-3">
            <div className="font-bold text-gray-800">{sendmessage.name}</div>
            <h1 className="text-gray-600">{sendmessage.email}</h1>
          </div>
          <div className="col-end-13 col-span-2">
            <img src={callicon} alt="call" className="w-[30px] h-[30px] m-2" />
          </div>
        </div>

        <div className="h-[75%] bg-gray-300 overflow-scroll" ref={chatBoxRef}>
          {message.length > 0 ? (
            message.map((message, index) => {
              return (
                <div key={index}>
                  {user._id === message.userd._id ? (
                    <div className="bg-blue-200 max-w-[40%] border px-2 py-2 mt-5 ml-auto mr-4">
                      <p className="break-words">{message.message}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-200 max-w-[40%] border px-2 py-2 mt-5 ml-4">
                      <p className="break-words">{message.message}</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <h1>send a msg to get started</h1>
          )}
        </div>

        <div className="w-full flex items-center">
          <Input
            placeholder="Type a message"
            type="text"
            name="message"
            value={sendmessage.message}
            inputclass="w-full h-full"
            onChange={(e) => {
              e.preventDefault();
              setsendmessage((prevstate) => ({
                ...prevstate,
                message: e.target.value,
              }));
            }}
          />
          <img
            src={sendicon}
            alt="sendicon"
            className="cursor-pointer w-[30px] h-6 ml-3 "
            onClick={() =>
              handleSendMessage(
                sendmessage.convoid,
                sendmessage.recid,
                sendmessage.message
              )
            }
          />
        </div>
      </div>

      {/* this is right part */}

      <div className="h-screen border w-[20%] ">
        <div className="h-[90%] overflow-auto">
          <div>
            <Input placeholder="search username" type="text" value={search} onChange={(e)=>{setSearch(e.target.value)}} />
          </div>
          {availableusers.length > 0 ? (
            availableusers.filter((user)=>{
              return search===''?true : user.name.toLowerCase().includes(search.toLowerCase())
            }).map((user, index) => {
              return (
                <div key={index}>
                  <div className="grid grid-cols-4 gap-2 m-3">
                    <img
                      src={Avatar}
                      alt="avatar"
                      className="cursor-pointer col-span-1  rounded-full p-1"
                    />
                    <div
                      className="cursor-pointer col-span-3 "
                      onClick={() => {
                        handlemessage("new", user);
                      }}
                    >
                      <div className="font-bold text-gray-800">{user.name}</div>
                      <h1 className="text-gray-600">{user.email}</h1>
                    </div>
                  </div>
                  <hr />
                </div>
              );
            })
          ) : (
            <p>no ava</p>
          )}
        </div>
        <div className="sticky bottom-1">
          <Button
            name="logout"
            fun={() => {
              localStorage.removeItem("user:token");
              localStorage.removeItem("user:details");
              navigate("users/signin");
              setIsLoggedIn(false);
              // console.log("logout");
            }}
          ></Button>
        </div>
      </div>
    </div>

   
  );
};

export default Dashboard;
