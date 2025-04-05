import React from 'react'
import { useState } from "react";
import logo from './Hadeed-Saudi.png';
import './LOGO.css';
function LOGO(){
    return(
        <div className="logo-container">
  <a href="/" style={{cursor: "default"}}>
    <img style={{width: "100%", height: "100%"}} src={logo} alt="Logo" className="logo" />
  </a>
</div>

      

    );
}
export default LOGO;






