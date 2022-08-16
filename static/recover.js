import React from 'react';
import { Link, Redirect, withRouter } from 'react-router-dom';
import { Header } from './header.js';
import { W3Color } from './utils.js';

const c = new W3Color;

export class RecoverForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: '',
                   eMail: '',
                   authError: false,
                   isLoading: false};
    this.myIsMounted = false;
    this.handleChangeUser = this.handleChangeUser.bind(this);
    this.handleChangeEmail = this.handleChangeEmail.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.myIsMounted = true;
  }

  componentWillUnmount() {
    this.myIsMounted = false;
  }

  handleChangeUser(event) {
    this.setState({ username: event.target.value});
  }
  handleChangeEmail(event) {
    this.setState({ eMail: event.target.value});
  }

  renderUsername() {
    return  <input type="text"
                  className={"w3-input w3-round w3-padding-16 " +
                             (this.state.authError ? "w3-rightbar w3-border-red":"") }
                  value={this.state.username}
                  name="username"
                  onChange={(event) => this.handleChangeUser(event)} />
  }
  renderEmail() {
    return <input type="email"
                  className={"w3-input w3-round w3-padding-16 " +
                             (this.state.authError ? "w3-rightbar w3-border-red":"") }
                  value={this.state.eMail}
                  name="email"
                  onChange={(event) => this.handleChangeEmail(event)}></input>
  }

  handleSubmit(event) {
      event.preventDefault();
      const username = this.state.username;
      if (!username) {
        alert('User name must be entered')
        return false
      }
      const email = this.state.eMail;
      if (!email){
        alert('User E-mail must be entered')
        return false
      }
      this.myIsMounted && this.setState({isLoading: true})
      let xhr = new XMLHttpRequest();
      const url = '/v1/users/recover';
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = (event) => this.setAuthTokens(xhr);
      const datas = JSON.stringify({username: username,
                                    email: email});
      xhr.send(datas);
  }

  setAuthTokens(xhr) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      const json = JSON.parse(xhr.responseText);
      //go ahead and clear the username and password from memory
      //we don't want to hold on to that for very long.
      this.myIsMounted && this.setState({username: '',
                                         eMail: '',
                                         isLoading: false});
      this.props.history.push("/pwreset");
    }else if (xhr.readyState == 4 && xhr.status != 200){
      alert(xhr.responseText)
      this.myIsMounted && this.setState({authError: true,
                                         isLoading: false});
    }
  }

  render () {
    return  (
      <>
        <Header history={ this.props.history } inner="PW reset" />
        <div className={"w3-margin w3-row-padding"}>
          <div className="w3-content" >
          <form method="POST"
                className={"w3-card w3-container w3-padding-32" +
                           "w3-form "}
                onSubmit={(event) => this.handleSubmit(event)} >
            <p>
             { this.state.authError ? "Failed to Authenticate":""}
            </p>
            <div className= "w3-container w3-margin-top" >
              <label htmlFor="username" >
                User Name
              </label>
              { this.renderUsername() }
              <p>
              <label htmlFor="email" >
                E-Mail
              </label>
              { this.renderEmail() }
              </p>
              { this.state.isLoading && <>
                <label htmlFor="loginBtn">
                  <i className="fa fa-cog fa-spin fa-fw fa-3x"></i>
                </label>
                <input  type="submit"
                        style={{display: "none"}}
                        id="loginBtn"
                        value="Log in"
                        className="call-to-action w3-button w3-red" /></>
              }
              { !this.state.isLoading &&
                <input  type="submit"
                        value="Send Recovery E-mail"
                        className="call-to-action w3-button"/>
              }
              <br />
              <Link className="w3-button w3-margin-top w3-margin-bottom" to='/register' >
                Sign up here!
              </Link>
            </div>
          </form>
          </div>
        </div>
      </>
    )
  }
}
