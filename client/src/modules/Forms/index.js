import React, { useState } from "react";
import Input from "../../components/index.js";
import Button from "../../components/butt.js";
import { Link ,useNavigate} from "react-router-dom";

const Form = ({ issignup = true }) => {
  const navigate = useNavigate();

  const [value, setValue] = useState({
    ...(issignup ? { name: "" } : {}),
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValue((prevstate) => ({
      ...prevstate,
      [name]: value,

    }));
  };

  const handlesubmit = async (e) => {
    e.preventDefault();
    console.log(value);
    try {
      const res = await fetch(
        `http://localhost:3000/api/${issignup ? "signup" : "signin"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        }
      );
      console.log('Response Status:', res.status); // Debugging statement
      console.log('Response OK:', res.ok); // Debugging statement

    

      if (res.ok) {
        console.log((issignup ? "signup successfull":"login successful"));
        const resdata = await res.json();
        console.log(resdata);
        if(resdata.token){
          localStorage.setItem("user:token",resdata.token);
          localStorage.setItem("user:details",JSON.stringify(resdata));
          navigate('/');
          return;
        }
        
        setValue({
          ...(issignup ? { name: "" } : {}),
          email: "",
          password: "",
        });
        if(issignup){
          alert("signup sucessfull");
          
        }

        return;

      } else {
        const resdata = await res.text();
        alert(resdata);
        setValue({
          ...(issignup ? { name: "" } : {}),
          email: "",
          password: "",
        });
        return;
      }


    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="bg-slate-300 h-screen flex justify-center items-center ">
      <div className="bg-white w-[500px] h-[600px] shadow-2xl flex flex-col justify-center items-center rounded-lg">
        <div className="text-4xl p-1 ">Welcome</div>
        <div className="text-3sm h-[50px]">
          {issignup ? "Sign up to enter" : "sign in to enter"}
        </div>
        <form
          className="w-full flex flex-col "
          onSubmit={(e) => handlesubmit(e)}
        >
          {issignup && (
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={value.name}
              onChange={handleChange}
            />
          )}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={value.email}
            onChange={handleChange}
          />
          <Input
            label="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={value.password}
            onChange={handleChange}
          />
          <Button name={issignup ? "signup" : "signin"} />
        </form>
        <div className="mt-2">
          {issignup ? "already have an account?" : "Don't have an account?"}
          <span className="text-primary underline cursor-pointer ">
            <Link to={issignup ? "/users/signin" : "/users/signup"}>
              {issignup ? "sign_in" : "sign_up"}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Form;
