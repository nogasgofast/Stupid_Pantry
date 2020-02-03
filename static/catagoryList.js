import React from 'react';
import { Link, withRouter } from "react-router-dom";
import { Header } from './header.js';
import { W3Color, Request, GroupActionList } from './utils.js';

const color = new W3Color;

class Catagories extends GroupActionList {
  constructor(props) {
    super(props);
    this.state = {
      buttons: new Set(),
      selectedItems: new Set()
    };
    }


  render_item(item) {
    return(
        <Link key={ item.name } to={ '/' + item.name }>
         <li className={"w3-card w3-left-align " +
           (this.state.selectedItems.has(item.name) ?
           "w3-border-yellow w3-rightbar" :
           "")} >
            <button className="w3-btn w3-hover-yellow">
              { item.name }
            </button>
          <span className={"w3-right w3-badge " + color.random()} >{ item.value }</span>
         </li>
        </Link>
        )
  }

  renderList(){
    let list = [];
    list.push(this.render_item( { name: 'recipes', value: this.props.recipes } ));
    list.push(this.render_item( { name: 'mealplans', value: this.props.mealplan } ));
    list.push(this.render_item( { name: 'shopping', value: this.props.shopping } ));
    list.push(this.render_item( { name: 'pantry', value: this.props.pantry } ));
    return list;
  }
}

export class CatagoryList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pantry: 0,
      recipes: 0,
      mealplan: 0,
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
      recipes: json.recipes,
      meaplan: json.mealplan,
      pantry: json.ingredients,
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
        <Header history={ this.props.history } inner="Catagories" isLoggedIn={ this.props.isLoggedIn } />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-content "} >
            <Catagories recipes={ this.state.recipes }
                        mealplan={ this.state.mealplan }
                        shopping={this.state.shopping }
                        pantry={this.state.pantry }
                        { ...this.props }
                         />
          </div>
        </div>
      </>
    );
  }
}
