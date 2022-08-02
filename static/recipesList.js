import React from 'react';
import { Link, Redirect } from "react-router-dom";
import { Header } from './header.js';
import { W3Color, Request, LinkDispList } from './utils.js';

const color = new W3Color;

class Recipes extends LinkDispList {


    renderItem(item){
      return  <Link key={ item.name } to={'/recipes/view/' + item.name } >
                { item.imagePath ? (
                      <img className="cover" src={ item.imagePath } width="100%" />) :
                      "" }
                <li className={"w3-card w3-left-align " +
                   (this.state.selectedItems.has(item.name) ?
                   " w3-rightbar" :
                   "")}>
                        { item.name }
                      <span className={"w3-right w3-badge "+color.random()}>
                        { item.value }
                      </span>
                      { item.keepStocked ? (
                        <span aria-label="use picture">
                            <i className={"w3-large w3-margin-left fas fa-cart-arrow-down"}></i>
                        </span>): '' }
                </li>
            </Link>
    }
}

export class RecipesList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      recipes: [],
      isLoading: false
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
            isLoading: false
          });
        }
      } else if (xhr.readyState == 4){
        this.setState({ isLoading: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/views/recipes',
      data: '{}',
      method: 'GET',
      callBack: callBack,
      history: this.props.history
    };
    this.setState({isLoading: true});
    let req = new Request(settings);
    req.withAuth();
  }

  render() {
    return(
      <>
        <Header history={ this.props.history } inner="Recipes" />
        <div className="w3-margin w3-row-padding">
          <div className="w3-content">
            <Link to="/recipes/add">
              <button className="call-to-action w3-button w3-block w3-card" >Add Recipe</button>
            </Link>
            <br />
            <Recipes items={ this.state.recipes } />
          </div>
        </div>
      </>
    )
  }
}
