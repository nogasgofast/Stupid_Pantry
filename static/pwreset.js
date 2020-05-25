import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Header } from './header.js';
import { W3Color, Request } from './utils.js';

const color = new W3Color;

export class ResetForm extends React.Component {
  constructor(props) {
    super(props);
    const {pathname} = this.props.location;
    const token = pathname.replace('/pwreset/', '')
    this.state = { username: '',
                   password: '',
                   password2: '',
                   token: token,
                   isLoading: false};
    this.handleChangeUser = this.handleChangeUser.bind(this);
    this.handleChangePass = this.handleChangePass.bind(this);
    this.handleChangePass2 = this.handleChangePass2.bind(this);
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

  handleSubmit(event) {
      event.preventDefault();
      if (!this.state.password){
        alert("must enter a password")
        return false
      }
      if (!this.state.password2){
        alert("please fill both fields")
        return false
      }
      console.log(this.state.password.length)
      console.log(this.state.password2.length)
      if (this.state.password.length < 20 || this.state.password.length > 254){
        alert("password must be 20-254 characters in length, the security of which is your responsibility.")
        return false
      }
      if (this.state.password != this.state.password2){
        alert("password and password-verification must match exactly.")
        return false
      }

      this.setState({ isLoading: true });
      let xhr = new XMLHttpRequest();
      const url = '/v1/users/reset';
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = (event) => this.handleApiResponse(xhr);
      const datas = JSON.stringify({password: this.state.password,
                                    token: this.state.token});
      xhr.send(datas);
  }

  handleApiResponse(xhr) {
    if (xhr.readyState == 2 && xhr.status == 200) {
      //if it works delete the credentials here before moving on.
      this.setState({username: '',
                     password: '',
                     password2: '',
                     token: ''})
      this.props.history.push('/home');
    }else if (xhr.readyState == 2 && xhr.status !== 302){
      alert(xhr.responseText)
      this.setState({isLoading: false});
    }
  }

  render () {
    return  (
      <>
        <Header history={ this.props.history } inner={ this.props.location['pathname'].match('verify$') ? "Verify Email" : "Reset Password" } />
          <div className="w3-margin w3-row-padding">
            <div className="w3-content">
              <form method="POST"
                  className={ "w3-card " +
                              "w3-round " +
                              "w3-form " +
                              "w3-padding"}
                  onSubmit={(event) => this.handleSubmit(event)} >
                { !this.props.isReset ? (
                  <>
                    <h1 className="w3-green w3-center w3-xxlarge">Success!</h1>
                    <p>An email has been sent to your address. Please click that link to continue.</p>
                  </>
                ) : (
                  <>
                    <p>
                    <label htmlFor="password">
                      New Password
                    </label>
                    <input  type="password"
                            className="w3-input w3-round w3-padding-16"
                            maxLength={254}
                            size={254}
                            value={ this.state.password }
                            name="password"
                            onChange={(event) => this.handleChangePass(event)} />
                    </p>
                    <label htmlFor="password-verify">
                      New Password again
                    </label>
                    <input  type="password"
                            className="w3-input w3-round w3-padding-16"
                            value={ this.state.password2 }
                            maxLength={254}
                            size={254}
                            name="password-verify"
                            onChange={(event) => this.handleChangePass2(event)} />
                    <div className="w3-container w3-center w3-padding-16">
                      { !this.state.isLoading ? (
                        <input  type="submit"
                                id="cp_button"
                                value="Change Password"
                                className="w3-action w3-btn w3-hover-yellow w3-Indigo" />
                      ) : (
                        <label htmlFor="cp_button">
                          <i className="fa fa-cog fa-spin fa-fw fa-3x"></i>
                        </label>) }
                    </div>
                  </>
                ) }
              </form>
          </div>
        </div>
      </>
    )
  }
}
