import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { Request } from './utils.js';

class RecipeItem extends React.Component {
  render() {
    return (
      <li key={this.props.name} className="w3-container w3-list-item">
        <div className="w3-bar">
          <Link to={'/inventory/' + this.props.name }>
            <button className="w3-bar-item w3-button w3-hover-yellow">
              { this.props.name }
            </button>
          </Link>
          <div className="w3-bar-item w3-right w3-dropdown-hover">
            <button aria-label="re-add this package" className="w3-large w3-hover-yellow w3-btn">
              <i className="fas fa-bars"></i>
            </button>
            <div className="w3-dropdown-content w3-bar-block w3-card">
              <button className="w3-bar-item w3-btn w3-hover-yellow">Edit</button>
              <button className="w3-bar-item w3-btn w3-hover-yellow">Keep Stocked</button>
              <button className="w3-bar-item w3-btn w3-hover-yellow">View</button>
            </div>
          </div>
        </div>
      </li>
    )
  }
}



class RecipesList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: []
    }
  }

  componentDidMount() {
    this.myIsMounted = true;
    this.renderData();
  }

  componentWillUnmount() {
    this.myIsMounted = false;
  }

  renderData() {
    let callBack = (xhr) => {
        //console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        if(this.myIsMounted) {
          this.setState({
            list: json.list
          });
        }
      } else if (xhr.readyState == 4){
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/views/recipes',
      data: '{}',
      method: 'GET',
      callBack: callBack,
      accessToken: this.props.accessToken,
      refreshToken: this.props.refreshToken,
      isNotLoggedIn: this.props.isNotLoggedIn,
      updateAccessToken: this.props.updateAccessToken,
    };
    let req = new Request(settings);
    req.withAuth();
  }

  renderList() {
    const items = [];
    const build = (i) => {
      return <RecipeItem key={i.name}
                    name={i.name}
                    amount_pkg={i.amount_pkg}
                    amount_measure={i.amount_measure}
                    update={ () => this.renderData() } />
      }
    return this.state.list.map(build);
  }

  render() {
    return (
      <ul className="w3-ul">
        { this.renderList() }
      </ul>
    )
  }
}

export class RecipesView extends React.Component {
  render() {
    return(
      <>
        <Header inner="Recipes" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-display">
          <div className="w3-display-middle w3-twothird w3-container">
            <Link to="/recipes/add">
              <button className="w3-orange w3-hover-yellow w3-btn w3-block w3-card" >New Recipe</button>
            </Link>
            <RecipesList accessToken={this.props.accessToken}
                          refreshToken={this.props.refreshToken}
                          updateAccessToken={this.props.updateAccessToken}
                          isNotLoggedIn={this.props.isNotLoggedIn} />
          </div>
        </div>
      </>
    )
  }
}
