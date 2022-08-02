import React from 'react';
import { Link, Redirect, withRouter } from 'react-router-dom';
import { Header } from './header.js';
import { W3Color } from './utils.js';

const c = new W3Color;

export class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: '',
                   password: '',
                   authError: false,
                   isLoading: false};
    this.myIsMounted = false;
    this.handleChangeUser = this.handleChangeUser.bind(this);
    this.handleChangePass = this.handleChangePass.bind(this);
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
  handleChangePass(event) {
    this.setState({ password: event.target.value});
  }

  renderUsername() {
    return  <input type="text"
                  className={"w3-input w3-round w3-padding-16 " +
                             (this.state.authError ? "w3-rightbar w3-border-red":"") }
                  value={this.state.username}
                  placeholder="username"
                  name="username"
                  onChange={(event) => this.handleChangeUser(event)} />
  }
  renderPassword() {
    return <input type="password"
                  className={"w3-input w3-round w3-padding-16 " +
                             (this.state.authError ? "w3-rightbar w3-border-red":"") }
                  value={this.state.password}
                  placeholder="password"
                  name="password"
                  onChange={(event) => this.handleChangePass(event)}></input>
  }

  handleSubmit(event) {
      this.myIsMounted && this.setState({isLoading: true})
      event.preventDefault();
      const username = this.state.username;
      const password = this.state.password;
      let xhr = new XMLHttpRequest();
      const url = '/v1/auth';
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = (event) => this.setAuthTokens(xhr);
      const datas = JSON.stringify({username: username,
                                    password: password});
      xhr.send(datas);
  }

  setAuthTokens(xhr) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      const json = JSON.parse(xhr.responseText);
      //go ahead and clear the username and password from memory
      //we don't want to hold on to that for very long.
      this.myIsMounted && this.setState({username: '',
                                        password: '',
                                        isLoading: false});
      const isPassing = this.props.location.state && this.props.location.state.from;
      if(isPassing) {
        //console.log("I was passed to login!");
        this.props.history.push(this.props.location.state.from);
      }else{
        //console.log("Not Passed to login!");
        this.props.history.push("/home");
      }
    }else if (xhr.status == 401){
      this.myIsMounted && this.setState({authError: true,
                                         isLoading: false});
    }
  }

  render () {
    return  (
      <>
        <Header history={ this.props.history } inner="Login" />
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
              <label htmlFor="password" >
                Password
              </label>
              { this.renderPassword() }
              </p>
              <div className="w3-padding-16">
                { this.state.isLoading && <>
                  <label htmlFor="loginBtn">
                    <i className="fa fa-cog fa-spin fa-fw fa-3x"></i>
                  </label>
                  <input  type="submit"
                          style={{display: "none"}}
                          id="loginBtn"
                          value="Log in"
                          className="w3-button w3-red" /></>
                }
                { !this.state.isLoading &&
                  <input  type="submit"
                          value="Log in"
                          className="call-to-action w3-button"/>
                }
                <Link className="w3-button" to='/register' >
                  Sign up here!
                </Link>
                <Link className="w3-button" to='/recover' >
                  Forgot my Pssawrds!
                </Link>
              </div>
            </div>
          </form>
          </div>
        </div>
      </>
    )
  }
}
