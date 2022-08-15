import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Header } from './header.js';
import { W3Color, Request } from './utils.js';

const color = new W3Color;

export class RegisterForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: '',
                   password: '',
                   password2: '',
                   email: '',
                   isLoading: false,
                   isFailed: false,
                   message: ''};
    this.handleChangeUser = this.handleChangeUser.bind(this);
    this.handleChangePass = this.handleChangePass.bind(this);
    this.handleChangePass2 = this.handleChangePass2.bind(this);
    this.handleChangeEmail = this.handleChangeEmail.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChangeUser(event) {
    this.setState({ username: event.target.value});
  }
  handleChangePass(event) {
    this.setState({ password: event.target.value});
  }
  handleChangePass2(event) {
    this.setState({ password2: event.target.value});
  }
  handleChangeEmail(event) {
    this.setState({ email: event.target.value});
  }

  handleSubmit(event) {
      event.preventDefault();
      if (!this.state.username){
        alert("must enter a username")
        return false
      }
      if (!this.state.password){
        alert("must enter a password")
        return false
      }
      if (this.state.password.length < 20 || this.state.password.length > 254){
        alert("password must be 20-254 characters in length, try a random sentence.")
        return false
      }
      if (!this.state.password2) {
          alert("must enter a validation password")
          return false
      }
      if (this.state.password !== this.state.password2){
        alert("Password and verify password must be the same.")
        return false
      }
      if (!this.state.email){
        alert("must enter a E-Mail (For account recovery)")
        return false
      }

      this.setState({ isLoading: true });
      let xhr = new XMLHttpRequest();
      const url = '/v1/users';
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = (event) => this.handleApiResponse(xhr);
      const datas = JSON.stringify({username: this.state.username,
                                    password: this.state.password,
                                    email: this.state.email});
      xhr.send(datas);
  }

  handleApiResponse(xhr) {
    if (xhr.readyState == 4 && xhr.status == 201) {
      //if it works delete the credentials here before moving on.
      this.setState({username: '',
                     password: ''})
      this.props.history.push("/verify");
    }else if (xhr.readyState == 4 && xhr.status !== 201){
      alert(xhr.responseText)
      this.setState({isFailed: true,
                     isLoading: false});
    }
  }

  render () {
    return  (
      <>
        <Header history={ this.props.history } inner="Sign up" />
          <div className="w3-margin w3-row-padding">
            <div className="w3-content">
              <form method="POST"
                    className={ "w3-card " +
                                "w3-round " +
                                "w3-form " +
                                "w3-padding"}
                    onSubmit={(event) => this.handleSubmit(event)} >
                  <label htmlFor="username">
                    User Name
                  </label>
                  <input  type="text"
                          className="w3-input w3-round w3-padding-16"
                          value={ this.state.username }
                          maxLength={254}
                          size={254}
                          name="username"
                          onChange={(event) => this.handleChangeUser(event)} />
                  <p>
                  <label htmlFor="password">
                    Password
                  </label>
                  <input  type="password"
                          className="w3-input w3-round w3-padding-16"
                          maxLength={254}
                          size={254}
                          value={ this.state.password }
                          name="password"
                          onChange={(event) => this.handleChangePass(event)} />
                  </p>
                  <p>
                  <label htmlFor="password2">
                    Verify Password
                  </label>
                  <input  type="password"
                          className="w3-input w3-round w3-padding-16"
                          maxLength={254}
                          size={254}
                          value={ this.state.password2 }
                          name="password2"
                          onChange={(event) => this.handleChangePass2(event)} />
                  </p>
                  <label htmlFor="email">
                    E-Mail
                  </label>
                  <input  type="email"
                          className="w3-input w3-round w3-padding-16"
                          value={ this.state.email }
                          maxLength={254}
                          size={254}
                          name="email"
                          onChange={(event) => this.handleChangeEmail(event)} />
                  <div className="w3-container w3-center w3-padding-16">
                    { this.state.isLoading && <>
                      <label htmlFor="loginBtn">
                        <i className="fa fa-cog fa-spin fa-fw fa-3x"></i>
                      </label>
                      <input  type="submit"
                              style={{display: "none"}}
                              id="loginBtn"
                              value="Register"
                              className="w3-button w3-hover-yellow w3-red" /></>
                    }
                    { !this.state.isLoading &&
                      <input  type="submit"
                              value="Register"
                              className="w3-button w3-hover-yellow w3-Indigo"/>
                    }
                </div>
              </form>
          </div>
        </div>
      </>
    )
  }
}
