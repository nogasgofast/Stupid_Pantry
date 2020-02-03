import React from 'react';
import { Link, withRouter } from "react-router-dom";

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
      <div className="w3-container w3-padding w3-orange">
        <Link to="/nav">
          <h2>Smart Pantry</h2>
        </Link>
        <button onClick={ this.goback } className="w3-btn">
          <span className="w3-large">
             { this.props.inner == "Login"? this.props.inner : "< " + this.props.inner }
          </span>
        </button>
        <div className="w3-dropdown-click w3-right">
          <button className="w3-btn w3-hover-yellow w3-xxlarge" onClick={ this.toggleShow }>
            <i className="fas fa-hamburger"></i>
          </button>
          <div className={"w3-dropdown-content w3-orange w3-bar-block w3-border " +
                          ( this.state.show ? "w3-show" : "" )}
                style={{'position': 'absolute',
                        'left': '-82px'}}
                >
            <Link to="/logout" className="w3-bar-item w3-hover-yellow w3-button">Logout</Link>
          </div>
        </div>
      </div>
    )
  }
}
