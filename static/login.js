import React from 'react';
import { Route, Redirect } from 'react-router';

function username(props) {
  return (<input type="text"
                className="w3-input w3-round w3-padding-16"
                value={props.username}
                placeholder="username"
                name="username"
                onChange={props.onChange}></input>)
};

function password(props) {
  return (<input type="password"
                className="w3-input w3-round w3-padding-16"
                value={props.password}
                placeholder="password"
                name="password"
                onChange={props.onChange}></input>)
}


export default class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: '',
                   password: ''};
    this.handleChangeUser = this.handleChangeUser.bind(this);
    this.handleChangePass = this.handleChangePass.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChangeUser(event) {
    this.setState({ username: event.target.value});
  }
  handleChangePass(event) {
    this.setState({ password: event.target.value});
  }
  handleSubmit (event) {
    const username = this.state.username;
    const password = this.state.password;
    let xhr = new XMLHttpRequest();
    const url = '/v1/auth';
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => this.getAuthTokens(xhr);
    const datas = JSON.stringify({username: username,
                                  password: password});
    xhr.send(datas);
    event.preventDefault();
  }
  renderUsername() {
    return username({password: this.state.username,
              onChange: (event) => this.handleChangeUser(event)});
  }
  renderPassword() {
    return password({password: this.state.password,
              onChange: (event) => this.handleChangePass(event)});
  }

  getAuthTokens(xhr) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      console.log(xhr.responseText);
      const json = JSON.parse(xhr.responseText);
      this.props.updateCallback(json.access_token, json.refresh_token);
      this.props.toggleLoggedIn();
    }else if (this.readyState == 4){
      console.log(this.readyState +
                  " " +
                  this.status +
                  " " +
                  xhr.responseText
                   );
    }
  }
  render () {
    return  (<div className="w3-display">
              <form className={"w3-display-middle " +
                            "w3-card " +
                            "w3-round " +
                            "w3-form "}
                    onSubmit={(event) => this.handleSubmit(event)}>
                <div className="w3-container">
                  <h2>Login</h2>
                  <label htmlFor="username" hidden={true}>
                    username:
                  </label>
                  {this.renderUsername()}
                  <label htmlFor="password" hidden={true}>
                    password:
                  </label>
                  {this.renderPassword()}
                  <div className="w3-container w3-center w3-padding-16">
                    <input type="submit"
                           value="Log in"
                           readOnly={true}
                           className="w3-btn w3-yellow w3-input">
                    </input>
                    <a className="w3-btn" href='/register'>
                      Sign up here!
                    </a>
                  </div>
                </div>
              </form>
            </div>)
  }
}
