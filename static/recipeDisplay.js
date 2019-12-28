import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { GroupActionList, GroupActionItem, Request } from './utils.js';


export class Instructions_List_disp extends GroupActionList {
  constructor(props){
    super(props);
    this.state = {
      buttons: new Set([]),
      selectedItems: new Set()
    }
  }

  render_item(item){
    return <li className={"w3-card w3-left-align " +
               (this.state.selectedItems.has(item) ?
               "w3-border-yellow w3-rightbar" :
               "")}
               key={ item }>{ item }</li>
  }
}

export class Ingredient_List_disp extends GroupActionList {
  constructor(props){
    super(props);
    this.state ={
      buttons: new Set([]),
      selectedItems: new Set() };
  }

  renderItem(item) {
    return <li className={ "w3-card w3-border-yellow" }
                  key={ item } >
                { item }
          </li>
  }
}

// TODO: https://www.npmjs.com/package/react-avatar-editor

export class RecipeDisplay extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      recipe_name: '',
      ingredient_list: [],
      instructions: []
    };
    this.myIsMounted= false;
  }

  componentDidMount() {
    this.myIsMounted = true;
    this.renderThisRecipe();
  }

  componentWillUnmount() {
    this.myIsMounted = false;
  }

  renderThisRecipe(){
    //console.log(this.props.location);
    const {pathname} = this.props.location;
    //console.log(pathname);
    const recipeName = pathname.replace('/recipes/view/', '')
    //console.log(recipeName);
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        //console.log(JSON.parse(xhr.responseText))
        const recipe = JSON.parse(xhr.responseText)['name'];
        let ingredients = JSON.parse(xhr.responseText)['ingredients'];
        let dedupDisplay = (x) => {
          if (x[1] == x[2]){
            return  x[0] +' '+ x[1]}
          else{
            return x[0] +' '+ x[1] +' '+ x[2]
          }
        }
        let ingredients_display = ingredients.map( x => dedupDisplay(x) );
        let instructions = JSON.parse(xhr.responseText)['instructions'];
        instructions = instructions.split('\n');
        if (this.myIsMounted) {
          this.setState({ recipe_name: recipe,
                          ingredient_list: ingredients_display,
                          instructions: instructions });
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ ValidateIsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/recipes/'+ recipeName,
      method: 'GET',
      callBack: callBack,
      accessToken: this.props.accessToken,
      refreshToken: this.props.refreshToken,
      isNotLoggedIn: this.props.isNotLoggedIn,
      updateAccessToken: this.props.updateAccessToken,
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ValidateIsLoading: true});
    };
  }

  render() {
    return(
      <>
        <Header inner={ "Display Recipe" }
                isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-center " +
                          "w3-content " +
                          "w3-mobile "} >
            { this.state.recipe_name ? (<p><b>{ this.state.recipe_name }</b></p>): '' }
            { this.state.new_recipe_name ? (<p><b>{ this.state.new_recipe_name }</b></p>): '' }
            <Ingredient_List_disp items={ this.state.ingredient_list }
                          ingredient_update={(list)=>this.ingredient_update(list)}/>
            <div className={"w3-padding"}></div>
            <Instructions_List_disp items={ this.state.instructions }
                          instructions_update={(list)=>this.instructions_update(list)}/>
            <div className={"w3-padding"}></div>
          </div>
        </div>
      </>
    )
  }
}
