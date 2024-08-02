import React from 'react'
import { Navigate} from 'react-router-dom'

const ProtectedRoute=({children})=>{
    const isloggedin=localStorage.getItem('user:token')!==null;
    
    if(!isloggedin){
        return <Navigate to='/users/signin'/>;
    }
    return children;
}

export default ProtectedRoute;