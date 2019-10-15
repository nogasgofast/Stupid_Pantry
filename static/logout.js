import React from 'react';
import ReactDOM from 'react-dom';
import { withRouter } from "react-router-dom";
import { Header } from './header.js';


export class LogoutForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleAffirmative = this.handleAffirmative.bind(this);
    this.handleDenied = this.handleDenied.bind(this);
  }

  handleAffirmative() {
    this.props.updateAllTokens('','');
    this.props.setNotLoggedIn();
    this.props.history.push("/login");
  }
  handleDenied() {
    this.props.history.goBack();
  }

  render() {
    return (
      <>
        <Header inner="Logout" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-display">
          <div className="w3-card w3-container w3-xxlarge w3-display-middle">
            <div className="w3-bar w3-container w3-center w3-padding-32">
              <button onClick={this.handleAffirmative} className="w3-btn w3-padding w3-hover-yellow w3-margin-bottom">
                Sure!
              </button>
              <button onClick={this.handleDenied} className="w3-btn w3-hover-yellow">
                Nah!
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }
}
