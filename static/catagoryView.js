import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { W3Color, Request } from './utils.js';

const color = new W3Color;

class Catagories extends React.Component {
  render() {
    return(
      <ul className="w3-ul">
        <li className="w3-list-item">
          <Link to='/recipes'>
            <button className="w3-btn w3-hover-yellow">
              Recipes
            </button>
          </Link>
          <span className={"w3-right w3-badge " + color.random()} >{this.props.recipes}</span>
        </li>
        <li className="w3-list-item">
          <Link to='/shopping'>
            <button className="w3-btn w3-hover-yellow">
              Shopping
            </button>
          </Link>
          <span className={"w3-right w3-badge " + color.random()} >{this.props.shopping}</span>
        </li>
        <li className="w3-list-item">
          <Link to='/pantry'>
            <button className="w3-btn w3-hover-yellow">
              Pantry (all items)
            </button>
          </Link>
          <span className={"w3-right w3-badge " + color.random()} >{this.props.ingredients}</span>
        </li>
      </ul>)
  }
}

export class CatagoryView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ingredients: 0,
      recipes: 0,
      shopping: 0,
      done: false
    };
    this.myIsMounted= false;
  }

  componentDidMount() {
    this.myIsMounted = true;
    this.getLists();
  }

  componentWillUnmount() {
    this.myIsMounted = false;
  }

  updateLists(json) {
    this.setState({
      ingredients: json.ingredients,
      recipes: json.recipes,
      shopping: json.shopping,
      done: true
    });
  }

  getLists() {
    const callBack = (xhr) => {
        //console.log(xhr.responseText);
      if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        if(this.myIsMounted) {
          this.updateLists(json);
        }
      } else if (xhr.readyState == 4){
        console.log( "Status " + xhr.status + " " + xhr.responseText);
      }
    };
    const settings = {
      url: '/v1/views/catagories',
      data: null,
      method: 'GET',
      callBack: callBack,
      ...this.props
    };

    if( !this.state.done ) {
      let req = new Request(settings);
    req.withAuth();
    }
  }

  render() {
    return(
      <>
        <Header inner="Your Lists" isLoggedIn={ this.props.isLoggedIn } />
        <div className="w3-padding w3-row w3-container w3-center">
          <div className="w3-center w3-twothird w3-card w3-container">
            <Catagories recipes={ this.state.recipes }
                        shopping={this.state.shopping}
                        ingredients={this.state.ingredients}
                        accessToken={this.props.accessToken}
                        refreshToken={this.props.refreshToken}
                        updateAccessToken={this.props.updateAccessToken}
                        isNotLoggedIn={this.props.isNotLoggedIn} />
          </div>
        </div>
      </>
    );
  }
}
