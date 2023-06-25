import React from 'react';
// import { useState,useRef } from 'react' ;
import { useNavigate } from 'react-router-dom';
import '../css/workStyle.css';
import { useAuth0 } from "@auth0/auth0-react";
const WorkStyle = ({ title, info, routePath }) => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();
    const navigate = useNavigate();
    function redirect() {
        if (isAuthenticated) {
            navigate(routePath);
        } else {
            loginWithRedirect();
            navigate('/');
        }
    }
    return (
        <>
            <div className="card">
                <span className='title-container'>
                    <h3 className="title">{title}</h3>
                    <p className='info'>{info}</p>
                </span>
                <div className="button-box">
                    <button className="card-btn" onClick={redirect}> LET'S GO </button>
                </div>
            </div>
        </>
    );
}
export default WorkStyle