import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { Request } from './utils.js';

class ShoppingItem extends React.Component {
  render() {
    return (
      <li key={this.props.name} className="w3-list-item">
        <div className="w3-bar w3-left">
          <Link to={'/inventory/' + this.props.name }>
            <button className="w3-bar-item w3-button w3-hover-yellow">
              { this.props.name +
                ", " +
                this.props.amount_pkg +
                " " +
                this.props.amount_measure
              }
            </button>
          </Link>
          <div className="w3-right">
            <button aria-label="edit" className="w3-bar-item w3-large w3-hover-yellow w3-button">
              <i className="fas fa-edit"></i>
            </button>
          </div>
        </div>
      </li>
    )
  }
}



class ShoppingList extends React.Component {
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
      url: '/v1/views/pantry',
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
      return <ShoppingItem key={i.name}
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

export class PantryView extends React.Component {
  render() {
    return(
      <>
        <Header inner="Pantry" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-display">
          <div className="w3-display-middle w3-twothird w3-container">
            <button className="w3-orange w3-hover-yellow w3-btn w3-block w3-card" >New Item</button>
            <ShoppingList accessToken={this.props.accessToken}
                          refreshToken={this.props.refreshToken}
                          updateAccessToken={this.props.updateAccessToken}
                          isNotLoggedIn={this.props.isNotLoggedIn} />
          </div>
        </div>
      </>
    )
  }
}
