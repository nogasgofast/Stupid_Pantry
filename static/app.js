import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Redirect, Switch, Link, withRouter } from "react-router-dom";
import { LoginForm } from './login.js' ;
import { LogoutForm } from './logout.js' ;
import { RegisterForm } from './register.js' ;
import { CatagoryView } from './catagoryView.js';
import { ShoppingView } from './shoppingView.js';
import { PantryView } from './pantryView.js';
import { RecipesView } from './recipesView.js';
import { RecipesAdd } from './recipesAdd.js';
import { RecipesHelp } from './recipesHelp.js';

const ProtectedRoute = ({component: Component, isLoggedIn, ...rest}) => (
  <Route render={(props) => (
        isLoggedIn ? (
        <Component {...props} {...rest} isLoggedIn={isLoggedIn} />
        ) : (
        <Redirect to={{pathname:'/login', state: {from: props.location}}} />
        )
      ) //end Lambda
    } //end render
  />
);


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accessToken: '',
      refreshToken: '',
      isLoggedIn: false
    };
  }

  setLoggedIn() {
    this.setState({
      isLoggedIn: true
    })
  }
  setNotLoggedIn() {
    this.setState({
      isLoggedIn: false
    })
  }

  updateAccessToken(token) {
    this.setState({ accessToken: token });
  }
  updateAllTokens(access,refresh) {
    this.setState({ accessToken: access,
                    refreshToken: refresh});
  }

  //<Redirect to={this.props.location.prev} />
  render() {
    const preProps = {
                    isLoggedIn: this.state.isLoggedIn,
                    accessToken: this.state.accessToken,
                    refreshToken: this.state.refreshToken,
                    setLoggedIn: () => this.setLoggedIn(),
                    setNotLoggedIn: () => this.setNotLoggedIn(),
                    // I may want to combine these into a more useable single function
                    // since they alsmot do the same thing.
                    updateAccessToken: (access) => this.updateAccessToken(access),
                    updateAllTokens: (access,refresh) => this.updateAllTokens(access,refresh)};
    return (
      <Switch>
        <Route path="/register"
               render={(props)=><RegisterForm {...props} {...preProps} />} />
        <Route path="/login"
               render={(props)=><LoginForm {...props} {...preProps} />} />
        <Route path="/logout"
               render={(props)=><LogoutForm {...props} {...preProps} />} />
        { /* beyond this point login required */ }
        <ProtectedRoute exact
                        path="/" {...preProps}
                        to="/nav"
                        component={ Redirect } />
        <ProtectedRoute path="/pantry" {...preProps}
                        component={ PantryView } />
        <ProtectedRoute path="/shopping" {...preProps}
                        component={ ShoppingView } />
        <ProtectedRoute exact
                        path="/recipes" {...preProps}
                        component={ RecipesView } />
        <ProtectedRoute path="/recipes/add" {...preProps}
                        component={ RecipesAdd } />
        <ProtectedRoute path="/recipes/help" {...preProps}
                        component={ RecipesHelp } />
        <ProtectedRoute path="/nav" {...preProps}
                        component={ CatagoryView } />
      </Switch>
    )
  }
}

// (<Redirect to="/login" />)

// ========================================
ReactDOM.render((
  <BrowserRouter >
    <App />
  </BrowserRouter>
  ),
  document.getElementById('root')
);
