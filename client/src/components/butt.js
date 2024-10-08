import React from 'react'

const Button=({
    name='sing up',
    fun=()=>{},
})=>{
    return (
        <div className='mt-4 ml-[40%]'>
            <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={fun}>
                {name}
            </button>
        </div>
    )
}

export default Button;