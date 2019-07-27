import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Redirect, Switch, Link } from "react-router-dom";
import LoginForm from './login.js' ;
import CatagoryView from './catagoryView.js';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accessToken: '',
      refreshToken: '',
      isLoggedIn: false};
  }
  updateAccessToken(token) {
    this.setState({ accessToken: token });
  }
  updateAllTokens(access,refresh) {
    this.setState({ accessToken: access,
                    refreshToken: refresh});
  }
  toggleLoggedIn() {
    this.setState({
      isLoggedIn: this.state.isLoggedIn ? false : true
    })
  }

  render() {
    return(
        <Switch>
          <Route path="/" exact>
            <h1>Welcome!</h1>
            <Link to="/login">Go to Login Here!</Link>
          </Route>
          {/* add routes here! */}
          <Route path="/login" exact>
            { console.log(this.state.isLoggedIn) }
            { this.state.isLoggedIn ? (<Redirect to="/nav" />) : (
              <LoginForm accessToken={this.state.accessToken}
                         refreshToken={this.state.refreshToken}
                         updateCallback={(access,refresh) => this.updateAllTokens(access,refresh)}
                         toggleLoggedIn={() => this.toggleLoggedIn()} />
              )
            }
          </Route>
          <Route path="/nav" exact>
          <CatagoryView accessToken={this.state.accessToken}
                     refreshToken={this.state.refreshToken}
                     updateCallback={(access,refresh) => this.updateCallback(access,refresh)}
                     toggleLoggedIn={() => this.toggleLoggedIn()} />
          </Route>
        </Switch>)
    // return <ComponentRouter
    //   accessToken={this.state.accessToken}
    //   efreshToken={this.state.refreshToken}
    //   updateCallback={(access, refresh) => this.updateAllTokens(access,refresh)} />
  }
}



// ========================================
ReactDOM.render((
  <BrowserRouter>
    <App />
  </BrowserRouter>
  ),
  document.getElementById('root')
);
