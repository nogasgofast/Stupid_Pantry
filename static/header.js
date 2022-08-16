import React from 'react';
import { Link } from "react-router-dom";

export class Header extends React.Component {
  constructor(props){
    super(props);
    //this.history = [];
    this.state = {
      show: false
    };
    this.toggleShow = this.toggleShow.bind(this);
    this.goback = this.goback.bind(this);
  }

  toggleShow(){
    this.setState({ show: !this.state.show });
  }

  goback(){
    this.props.history.goBack();
  }

  render () {
    return (
      <div className="w3-card">
        <div className="w3-bar">
            <Link to="/home">
              <h1 className="w3-margin-left w3-bar-item w3-round-large w3-button">{ this.props.inner }</h1>
            </Link>
            <div className="w3-bar-item w3-right w3-round">
              <button className="w3-button w3-round-large w3-xxlarge"
                      value="all pages" onClick={ this.toggleShow }>
                <i className="fas fa-hamburger"></i> Menu
              </button>
              <div className={"w3-dropdown-content w3-bar-block w3-border " +
                              ( this.state.show ? "w3-show" : "" )}
                    style={{'position': 'absolute',
                            'right': '0px'}}>
                <Link to="/about_us" className="w3-bar-item w3-button">About Us</Link>
                <Link to="/" className="w3-bar-item w3-button">Home</Link>
                <Link to="/mealplans" className="w3-bar-item w3-button">Meal Plans</Link>
                <Link to="/pantry" className="w3-bar-item w3-button">Pantry</Link>
                <Link to="/recipes" className="w3-bar-item w3-button">Recipes</Link>
                <Link to="/search" className="w3-bar-item w3-button">Search</Link>
                <Link to="/shopping" className="w3-bar-item w3-button">Shopping</Link>
                <Link to="/account" className="w3-bar-item w3-button">Not the Account</Link>
                <Link to="/logout" className="w3-bar-item w3-button">Logout</Link>
              </div>
            </div>
        </div>
      </div>
    )
  }
}
//<Link to="/settings" className="w3-bar-item w3-hover-yellow w3-button">Settings</Link>
