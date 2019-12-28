import React from 'react';
import { Link, Redirect } from "react-router-dom";
import { Header } from './header.js';
import { W3Color, Request, GroupActionList } from './utils.js';

const color = new W3Color;

class Recipes extends GroupActionList {
  constructor(props) {
    super(props);
    this.state = {
      buttons: new Set([{action: "view",
                         image: <i className="fas fa-edit"></i>,
                         do: () => this.edit_recipe() },
                        {action: "delete" ,
                         image: <i className="fas fa-cart-plus"></i>,
                         do: () => this.stock_recipe() }]),
      selectedItems: new Set(),
      is_redirecting: false,
      location: ''
    };
    }

    componentDidMount() {
      this.myIsMounted = true;
    }

    componentWillUnmount() {
      this.myIsMounted = false;
    }

    render_item(item){
      return  <li key={ item.name } className={"w3-card w3-left-align " +
                   (this.state.selectedItems.has(item.name) ?
                   "w3-border-yellow w3-rightbar" :
                   "")}
                   onClick={() => this.handleSelect(item.name)}>
                      { this.state.is_redirecting ? (
                          <Redirect to={ this.state.location } />) : '' }
                      <Link to={'/recipes/view/' + item.name } >
                        { item.name }
                      </Link>
                      <div className={"w3-right w3-badge "+color.random()}>
                        { item.value }
                      </div>
                      { item.keepStocked ? (
                        <label aria-label="use picture">
                            <i className={"w3-right w3-margin-right fas fa-shopping-cart"}></i>
                        </label>): '' }
              </li>
    }

    edit_recipe(){
      //console.log(this.state.selectedItems)
      let item  = this.state.selectedItems.values().next().value;
      //console.log(item);
      this.setState({
        is_redirecting: true,
        location: '/recipes/' + item});
    }

    stock_recipe(){
      name = this.state.selectedItems.values().next().value;
      let item = '';
      for (const thing of this.props.items ){
        if (thing.name == name){
           item = thing;
        }
      }
      console.log(item);
      let callBack = (xhr) => {
          //console.log(xhr.responseText);
          if ((xhr.readyState == 4) && xhr.status == 200) {
          const json = JSON.parse(xhr.responseText);
          if(this.myIsMounted) {
            item.keepStocked = !item.keepStocked;
            this.setState({
              is_loading: false,
              selectedItems:  new Set()
            });
          }
        } else if (xhr.readyState == 4){
          this.setState({ is_loading: false })
          console.log( "Short Status " + xhr.status);
        }
      };

      const settings = {
        url: '/v1/requirements/'+ item.name,
        data: '{}',
        method: 'PUT',
        callBack: callBack,
        ...this.props
      };
      this.setState({is_loading: true});
      let req = new Request(settings);
      req.withAuth();
    }
}

export class RecipesList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      recipes: [],
      is_loading: false
    }
    this.myIsMounted = false;
  }

  componentDidMount() {
    this.myIsMounted = true;
    this.renderRecipes();
  }

  componentWillUnmount() {
    this.myIsMounted = false;
  }

  renderRecipes(){
    let callBack = (xhr) => {
        //console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        if(this.myIsMounted) {
          this.setState({
            recipes: json.list,
            is_loading: false
          });
        }
      } else if (xhr.readyState == 4){
        this.setState({ is_loading: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/views/recipes',
      data: '{}',
      method: 'GET',
      callBack: callBack,
      ...this.props
    };
    this.setState({is_loading: true});
    let req = new Request(settings);
    req.withAuth();
  }

  render() {
    return(
      <>
        <Header inner="Recipes" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-container w3-padding">
          <Link to="/recipes/add">
            <button className="w3-orange w3-hover-yellow w3-btn w3-block w3-card" >New Recipe</button>
          </Link>
          <Recipes  items={ this.state.recipes } {...this.props } />
        </div>
      </>
    )
  }
}
