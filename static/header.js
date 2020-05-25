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
              <h2 className="w3-bar-item">Smart Pantry</h2>
            </Link>
            <div className="w3-dropdown-click w3-bar-item w3-right w3-hover-orange w3-round">
              <button className="w3-btn w3-orange w3-round-large w3-hover-yellow w3-xxlarge" onClick={ this.toggleShow }>
                <i className="fas fa-hamburger"></i>
              </button>
              <div className={"w3-dropdown-content w3-orange w3-bar-block w3-border " +
                              ( this.state.show ? "w3-show" : "" )}
                    style={{'position': 'absolute',
                            'right': '0px'}}>
                <Link to="/" className="w3-bar-item w3-hover-yellow w3-button">Home</Link>
                <Link to="/recipes" className="w3-bar-item w3-hover-yellow w3-button">Recipes</Link>
                <Link to="/mealplans" className="w3-bar-item w3-hover-yellow w3-button">Meal Plans</Link>
                <Link to="/shopping" className="w3-bar-item w3-hover-yellow w3-button">Shopping</Link>
                <Link to="/pantry" className="w3-bar-item w3-hover-yellow w3-button">Pantry</Link>
                <Link to="/search" className="w3-bar-item w3-hover-yellow w3-button">Search</Link>

                <Link to="/logout" className="w3-bar-item w3-hover-yellow w3-button">Logout</Link>
              </div>
            </div>
        </div>
            <span className="w3-large w3-padding">
               { this.props.inner }
            </span>
      </div>
    )
  }
}
//<Link to="/settings" className="w3-bar-item w3-hover-yellow w3-button">Settings</Link>
