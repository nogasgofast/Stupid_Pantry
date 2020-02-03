import React from 'react';
import { Link, Redirect, withRouter } from 'react-router-dom';
import { Header } from './header.js';
import { W3Color } from './utils.js';

const color = new W3Color;

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

export class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { username: '',
                   password: '',
                   color: '',
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
    return username({password: this.state.username,
                     onChange: (event) => this.handleChangeUser(event),
                     failed: this.state.isFailed});
  }
  renderPassword() {
    return password({password: this.state.password,
                     onChange: (event) => this.handleChangePass(event),
                     failed: this.state.isFailed});
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
      this.props.updateAllTokens(json.access_token, json.refresh_token);
      this.props.setLoggedIn();
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
        this.props.history.push("/");
      }
    }else if (xhr.status == 401){
      const acolor = color.random()
      this.myIsMounted && this.setState({color: acolor,
                                         isLoading: false});
    }
  }

  render () {
    return  (
      <>
        { this.props.isLoggedIn ? (<Redirect to='/nav' />) : '' }
        <Header history={ this.props.history } inner="Login" isLoggedIn={this.props.isLoggedIn} />
        <div className={"w3-margin w3-row-padding" + this.state.color }>
          <div className="w3-content" >
          <form method="POST"
                className={"w3-card w3-container w3-padding-32" +
                           "w3-form "}
                onSubmit={(event) => this.handleSubmit(event)} >
            <div className= "w3-container w3-margin-top" >
              { this.state.isFailed ? ("Invalid user or password!") : ("")}
              <label htmlFor="username" hidden={true}>
                username:
              </label>
              { this.renderUsername() }
              <label htmlFor="password" hidden={true}>
                password:
              </label>
              { this.renderPassword() }
              <div className="w3-bar w3-padding-16">
                { this.state.isLoading && <>
                  <label htmlFor="login_btn">
                    <i className="fa fa-cog fa-spin fa-fw fa-3x"></i>
                  </label>
                  <input  type="submit"
                                style={{display: "none"}}
                                id="login_btn"
                                value="Log in"
                                className="w3-btn w3-hover-yellow" /></>
                }
                { !this.state.isLoading &&
                  <input  type="submit"
                          value="Log in"
                          className="w3-btn w3-hover-yellow"/>
                }
                <Link className="w3-btn w3-right w3-hover-yellow" to='/register' >
                  Sign up here!
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
