import LoginForm from './login.js' ;
import CatagoryView from './catagoryView.js' ;
let e = React.createElement;


class componentRouter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      routes: { loginForm: LoginForm,
                catagoryView: CatagoryView },
      page: 'loginForm'
    };
  }
  navigate (newPage) {
    console.log("Fire!");
    this.setState({page: newPage});
  }
  render() {
    return (
         e(this.state.routes[this.state.page],
          {accessToken: this.state.accessToken,
           refreshToken: this.state.refreshToken,
           updateCallback: (access,refresh) => this.props.updateCallback(access,refresh),
           navigate: (page) => this.navigate(page)},
          null)
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accessToken: '',
      refreshToken: ''};
  }
  updateAccessToken(token) {
    this.setState({ accessToken: token });
  }
  updateAllTokens(access,refresh) {
    this.setState({ accessToken: access,
                    refreshToken: refresh});
  }

  render() {
    return( e(componentRouter, {
              accessToken: this.state.accessToken,
              efreshToken: this.state.refreshToken,
              updateCallback: (access, refresh) => this.updateAllTokens(access,refresh)},
              null) );
  }
}



// ========================================
ReactDOM.render(
  e(App, null, null ),
  document.getElementById('root')
);
