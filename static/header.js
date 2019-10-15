import React from 'react';
import { Link } from "react-router-dom";

export const Header = (props) => {
  return (
    <div className="w3-bar w3-padding w3-container w3-center w3-orange">
      <Link to="/nav" className="w3-container w3-btn w3-bar-item">
        <h1>
          { props.inner }
        </h1>
      </Link>
      <Link to={ props.isLoggedIn ? "/logout" : "/login"} className="w3-container w3-padding-16 w3-btn w3-xxxlarge w3-right w3-bar-item">
        <i className={ "fas " + ( props.isLoggedIn ? "fa-lock" : "fa-lock-open") } >
        </i>
      </Link>
    </div>
  )
}
