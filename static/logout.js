import React from 'react';
import ReactDOM from 'react-dom';
import { withRouter } from "react-router-dom";
import { Header } from './header.js';
import { Request } from './utils.js';

export class LogoutForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleAffirmative = this.handleAffirmative.bind(this);
    this.handleDenied = this.handleDenied.bind(this);
  }

  handleAffirmative() {
    let callBack = (xhr) => {
        console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        this.props.history.push("/login");
      } else if (xhr.readyState == 4){
        console.log( "Short Status " + xhr.status);
      }
    }
    const settings = {
      url: "/v1/auth/logout",
      data: '{}',
      method: 'POST',
      callBack: callBack,
      history: this.props.history
    }
    let req = new Request(settings)
    req.withAuth()
  }

  handleDenied() {
    this.props.history.goBack();
  }

  render() {
    return (
      <>
        <Header history={ this.props.history } inner="Logout" />
        <div className="w3-margin w3-row-padding" >
          <div className="w3-content">
          <button onClick={this.handleAffirmative} className="call-to-action w3-button w3-block w3-bar-item">
            Logout
          </button>
          <br />
          <button onClick={this.handleDenied} className="w3-button w3-block w3-bar-item">
            Return
          </button>
          </div>
        </div>
      </>
    )
  }
}
