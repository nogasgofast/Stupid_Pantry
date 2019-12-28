import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Redirect, Switch, Link, withRouter } from "react-router-dom";
import { LoginForm } from './login.js' ;
import { LogoutForm } from './logout.js' ;
import { RegisterForm } from './register.js' ;
import { CatagoryList } from './catagoryList.js';
import { ShoppingList } from './shoppingList.js';
import { PantryList } from './pantryList.js';
import { RecipesList } from './recipesList.js';
import { RecipesHelp } from './recipesHelp.js';
import { RecipeForm } from './recipeForm.js';
import { RecipeDisplay } from './recipeDisplay.js';

const ProtectedRoute = ({component: Component, isLoggedIn, ...rest}) => (
  <Route render={(props) => (
        isLoggedIn ?
        (<Component {...props} {...rest} isLoggedIn={isLoggedIn} />) :
        (<Redirect to={{pathname:'/login', state: {from: props.location}}} />)
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
                        component={ PantryList } />
        <ProtectedRoute path="/shopping list" {...preProps}
                        component={ ShoppingList } />
        <ProtectedRoute exact
                        path="/recipes" {...preProps}
                        component={ RecipesList } />
        <ProtectedRoute exact
                        path="/recipes/add" {...preProps}
                        is_edit={ false }
                        component={ RecipeForm } />
        <ProtectedRoute exact
                        path="/recipes/help" {...preProps}
                        component={ RecipesHelp } />
        <ProtectedRoute path="/recipes/view" {...preProps}
                        component={ RecipeDisplay } />
        <ProtectedRoute path="/recipes/" {...preProps}
                        is_edit={ true }
                        component={ RecipeForm } />
        <ProtectedRoute path="/nav" {...preProps}
                        component={ CatagoryList } />
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
