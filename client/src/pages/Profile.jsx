import React, { useState } from 'react'
import axios from 'axios'
import { useEffect } from 'react';
const Profile = () => {
    const [data, setData] = useState([]);
    const token = localStorage.getItem("token")
    useEffect(()=>{
        fetchProfile()
    },[data])
    const fetchProfile = async () => {
    try {
        // 1. Get the base URL from Vercel
        const baseURL = import.meta.env.VITE_APP_URL;

        // 2. Combine with your protected profile route
        const { data } = await axios.get(`${baseURL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        setData(data.profile);
    } catch (err) {
        console.error("Profile fetch error:", err);
    }
};
    return (
        <div className='container'>
            <h1 className='text-center mt-5 text-success'>Profile</h1>
            <div className='card mt-4'>
                <div className='card-body'>
                    <h5 className='card-title'>Name: {data.name}</h5>
                    <p className='card-text'>Email: {data.email}</p>
                    <p className='card-text'>Role: {data.role}</p>
                </div>
            </div>
        </div>
    )
}

export default Profile
