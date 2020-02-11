import React from 'react';
import { Link, Redirect } from "react-router-dom";
import { Header } from './header.js';
import { W3Color, Request, GroupActionList } from './utils.js';

const color = new W3Color;

class Recipes extends GroupActionList {
  constructor(props) {
    super(props);
    this.state = {
      buttons: new Set([]),
      selectedItems: new Set()};
    }

    render_item(item){
      return  <Link key={ item.name } to={'/recipes/view/' + item.name } >
                { item.imagePath ? (
                      <img className="cover" src={ item.imagePath } width="100%" />) :
                      "" }
                <li className={"w3-card w3-left-align " +
                   (this.state.selectedItems.has(item.name) ?
                   "w3-border-yellow w3-rightbar" :
                   "")}>
                        { item.name }
                      <div className={"w3-right w3-badge "+color.random()}>
                        { item.value }
                      </div>
                      { item.keepStocked ? (
                        <label aria-label="use picture">
                            <i className={"w3-right w3-margin-right w3-large fas fa-cart-arrow-down"}></i>
                        </label>): '' }
                </li>
            </Link>
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
        <Header history={ this.props.history }
                inner="Recipes" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className="w3-content">
            <Link to="/recipes/add">
              <button className="w3-orange w3-hover-yellow w3-btn w3-block w3-card" >New Recipe</button>
            </Link>
            <Recipes  items={ this.state.recipes } {...this.props } />
          </div>
        </div>
      </>
    )
  }
}
