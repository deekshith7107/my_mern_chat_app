import React from 'react';

const Input = ({
    inputclass='',
    classname='',
    label= '',
    name= '',
    type= '',
    placeholder= '',
    value='',
    onChange= ()=>{},
}) => {


    return (
        <div className={`w-[75%] ml-10 mb-3 mt-3 ${classname} `}>
            <label htmlFor={name} className=" text-sm font-medium leading-6 text-gray-900">{label}</label>
            <div className="mt-2">
                
                <input 
                    type={type}
                    name={name}
                    className={` w-full rounded-md border pl-7 pr-3 py-1 text-gray-900  placeholder:text-gray-400 ${inputclass}`} 
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
                
            </div>
        </div>
    );
};

export default Input;
