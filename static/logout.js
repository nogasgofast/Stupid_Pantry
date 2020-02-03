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
        <Header history={ this.props.history } inner="Logout"
                isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding" >
          <div className="w3-card w3-content">
          <button onClick={this.handleAffirmative} className="w3-btn w3-block w3-bar-item w3-hover-yellow">
            Logout
          </button>
          <button onClick={this.handleDenied} className="w3-btn w3-block w3-bar-item w3-hover-yellow">
            Return
          </button>
          </div>
        </div>
      </>
    )
  }
}
