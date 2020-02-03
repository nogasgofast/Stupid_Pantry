import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Header } from './header.js';
import { W3Color } from './utils.js';

const color = new W3Color;

export class RegisterForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: '',
                   password: '',
                   isFailed: false,
                   message: ''};
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

  handleSubmit(event) {
      event.preventDefault();
      const username = this.state.username;
      const password = this.state.password;
      this.setState({ isLoading: true });
      let xhr = new XMLHttpRequest();
      const url = '/v1/users';
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = (event) => this.setAuthTokens(xhr);
      const datas = JSON.stringify({username: username,
                                    password: password});
      xhr.send(datas);
  }

  setAuthTokens(xhr) {
    if (xhr.readyState == 4 && xhr.status == 201) {
      this.props.history.push("/login");
    }else if (xhr.readyState == 4 && xhr.status !== 201){
      const json = JSON.parse(xhr.responseText);
      this.setState({isFailed: true,
                     message: json });
    }
  }

  render () {
    return  (
      <>
        <Header history={ this.props.history }
                inner="Sign up" isLoggedIn={this.props.isLoggedIn} />
          <div className="w3-margin w3-row-padding">
            <div className="w3-content">
              <form method="POST"
                    className={ "w3-card " +
                                "w3-round " +
                                "w3-form " +
                                (this.state.isFailed ? color.random() : "")}
                    onSubmit={(event) => this.handleSubmit(event)} >
                <div className={"w3-container w3-margin-top" }>
                  { this.message }
                  <label htmlFor="username" hidden={true}>
                    username:
                  </label>
                  <input  type="text"
                          className="w3-input w3-round w3-padding-16"
                          value={ this.state.username }
                          placeholder="username"
                          name="username"
                          onChange={(event) => this.handleChangeUser(event)} />
                  <label htmlFor="password" hidden={true}>
                    password:
                  </label>
                  <input  type="password"
                          className="w3-input w3-round w3-padding-16"
                          value={ this.state.password }
                          placeholder="password"
                          name="password"
                          onChange={(event) => this.handleChangePass(event)} />
                  <div className="w3-container w3-center w3-padding-16">
                    <input  type="submit"
                            value={ !this.props.isLoading ? "Sign Up!" : (<i className="fa fa-cog fa-spin fa-fw fa-3x"></i>) }
                            className="w3-btn w3-hover-yellow" />
                  </div>
                </div>
              </form>
          </div>
        </div>
      </>
    )
  }
}
