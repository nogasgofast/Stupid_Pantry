import React from 'react';

class Catagories extends React.Component {
  render() {
    return(
      <ul className="w3-ul">
        <li><button className="w3-button w3-hover-yellow">Cookbook</button></li>
        <li><button className="w3-button w3-hover-yellow">Pantry</button></li>
        <li><button className="w3-button w3-hover-yellow">Shopping</button></li>
        <li><button className="w3-button w3-hover-yellow">Browsing</button></li>
      </ul>)
  }
}
class NavHeader extends React.Component {
  render() {
    return(
      <div className="w3-bar">
        <button className="fas fa-backward w3-yellow w3-xxlarge w3-bar-item"></button>
        <button className="w3-col fas fa-forward w3-yellow w3-xxlarge w3-bar-item w3-right"></button>
      </div>)
  }
}


export default class CatagoryView extends React.Component {
  render() {
    return(
      <div>
        <NavHeader />
        <div className="w3-padding w3-row w3-container w3-center">
          <div className="w3-center w3-twothird w3-card w3-container">
            <h1>Catagories</h1>
            <Catagories />
          </div>
        </div>
      </div>)
  }
}
