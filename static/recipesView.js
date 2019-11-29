import React from 'react';
import { Link, Redirect } from "react-router-dom";
import { Header } from './header.js';
import { Request, GroupActionList } from './utils.js';


class RecipesList extends GroupActionList {
  constructor(props) {
    super(props);
    this.state = {
      buttons: new Set(),
      selectedItems: new Set(),
      redirect: false };
    }

    render_item(item){
      return <li className={"w3-card w3-left-align " +
                 (this.state.selectedItems.has(item.name) ?
                 "w3-border-yellow w3-rightbar" :
                 "")}
                 key={ item.name }
                 onClick={() => this.handleSelect(item.name)}>
                    { item.name }
                    { this.state.redirect ?
                        (<Redirect to={'/recipes/' + this.state.redirect } />) :
                        '' }
              </li>
    }

    renderList(){
      let list = [];
      for (const item of this.props.items) {
        list.push(this.render_item(item));
      }
      return list;
    }

    handleSelect(item){
      this.setState({redirect: item});
    }

}

export class RecipesView extends React.Component {
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
      accessToken: this.props.accessToken,
      refreshToken: this.props.refreshToken,
      isNotLoggedIn: this.props.isNotLoggedIn,
      updateAccessToken: this.props.updateAccessToken,
    };
    this.setState({is_loading: true});
    let req = new Request(settings);
    req.withAuth();
  }

  render() {
    return(
      <>
        <Header inner="Recipes" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-container">
          <div className="w3-display-middle w3-twothird w3-container">
            <Link to="/recipes/add">
              <button className="w3-orange w3-hover-yellow w3-btn w3-block w3-card" >New Recipe</button>
            </Link>
            <RecipesList  items={ this.state.recipes } />
          </div>
        </div>
      </>
    )
  }
}
