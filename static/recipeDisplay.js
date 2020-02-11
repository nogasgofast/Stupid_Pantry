import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { GroupActionList, GroupActionItem,
         Request, W3Color, thumbnail } from './utils.js';

const color = new W3Color;

export class Instructions_List_disp extends GroupActionList {
  constructor(props){
    super(props);
    this.state = {
      buttons: new Set([]),
      selectedItems: new Set()
    }
  }

  render_item(item){
    return <li className={ "w3-card w3-left-align " }
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

  render_item(item) {
    //console.log(item)
    let viewAmount = 0
    let color = 'w3-green'
    item.viewAmount > 1 ? viewAmount = 1 : viewAmount = item.viewAmount
    if ( viewAmount <= 0.5 ){
      color = 'w3-yellow'
    }
    if ( viewAmount <= 0.25){
      color = 'w3-red'
    }
    return  <Link key={ item.name } to={'/pantry/' + item.name } >
                <li className={ "w3-card w3-border-yellow" }>
                  { item.amount+
                    " "+
                    item.amount_measure+
                    " "+
                    item.name }
                  <div className={ color }
                       style={{height:"4px",
                               width: 100 * viewAmount + "%" }}></div>
                </li>
            </Link>
  }
}

// TODO: https://www.npmjs.com/package/react-avatar-editor

export class RecipeDisplay extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      is_stocking: false,
      keepStocked: false,
      is_subtracting: false,
      subtracted: false,
      pictureIsLoading: false,
      recipe_name: '',
      imagePath: '',
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

  deletePicture(event){
    event.preventDefault();
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        const recipeText = JSON.parse(xhr.responseText)['text'];

        if (this.myIsMounted) {
          this.setState({ pictureIsLoading: false,
                          imagePath: '' });
        }
      } else if (state == 4 && cat != '2' && cat != '3') {
        this.setState({ pictureIsLoading: false });
        console.log(xhr.responseText);
      }
    };
    const settings = {
      url: '/v1/recipe/image/' + this.state.recipe_name,
      data: '{}',
      is_file_upload: true,
      method: 'DELETE',
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
      this.setState({pictureIsLoading: true});
    }
  }

  handlePictureUpload(files){
    for (let i = 0, f; f = files[i]; i++) {
      if (!f.type.match('image/.*')) {
        alert("Must be a image file");
      }else{
        let callBack = (xhr) => {
          //console.log(xhr.responseText);
          let state = xhr.readyState;
          let status = xhr.status;
          let cat = Math.floor(status/100);
          if ((state == 4) && status == 200) {
            const recipeText = JSON.parse(xhr.responseText)['text'];

            if (this.myIsMounted) {
              this.setState({ pictureIsLoading: false });
              this.renderThisRecipe();
            }
          } else if (state == 4 && cat != '2' && cat != '3') {
            this.setState({ pictureIsLoading: false,
                            recipeField: xhr.responseText });
          }
        };
        // from an input element
        var canvas  = document.createElement('canvas');
        var ctx = canvas.getContext("2d");
        var reader = new FileReader();
        reader.onload = (e)=>{
          let img = new Image();
          img.src = e.target.result;
          img.onload = ()=>{
            // console.log(e.target.result);
            // console.log(img);
            let MAX_WIDTH = 1200;
            let MAX_HEIGHT = 1600;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            // console.log(width);
            // console.log(height);
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob)=>{
              let formData = new FormData();
              console.log(blob.size);
              formData.append('file', blob, f.name );
              //console.log(formData.has('file'))
              const settings = {
                url: '/v1/recipe/image/' + this.state.recipe_name,
                data: formData,
                is_file_upload: true,
                method: 'POST',
                callBack: callBack,
                ...this.props
              };
              let req = new Request();
              req.props = settings;
              req.withAuth();
              if (this.myIsMounted) {
                this.setState({pictureIsLoading: true});
              }
            }, "image/jpeg");
          }
        }
        reader.readAsDataURL(f);
      }
    }
  }

  subtract_ingredients() {
    let name = this.state.recipe_name;
    let callBack = (xhr) => {
        //console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        if(this.myIsMounted) {
          this.setState({
            is_subtracting: false,
            subtracted:  true
          });
          this.renderThisRecipe();
        }
      } else if (xhr.readyState == 4){
        this.setState({ is_subtracting: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/inventory/use/' + this.state.recipe_name,
      data: '{}',
      method: 'PUT',
      callBack: callBack,
      ...this.props
    };
    this.setState({is_subtracting: true});
    let req = new Request(settings);
    req.withAuth();
  }

  stock_recipe() {
    let name = this.state.recipe_name;
    let callBack = (xhr) => {
        //console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        if(this.myIsMounted) {
          const keepStocked = !this.state.keepStocked;
          this.setState({
            is_stocking: false,
            keepStocked:  keepStocked
          });
        }
      } else if (xhr.readyState == 4){
        this.setState({ is_stocking: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/requirements/' + this.state.recipe_name,
      data: '{}',
      method: 'PUT',
      callBack: callBack,
      ...this.props
    };
    this.setState({is_stocking: true});
    let req = new Request(settings);
    req.withAuth();
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
        const recipe_count = JSON.parse(xhr.responseText)['value'];
        const keepStocked = JSON.parse(xhr.responseText)['keepStocked'];
        let ingredients = JSON.parse(xhr.responseText)['ingredients'];
        let instructions = JSON.parse(xhr.responseText)['instructions'];
        const imagePath = JSON.parse(xhr.responseText)['imagePath'];
        instructions = instructions.split('\n');
        if (this.myIsMounted) {
          this.setState({ recipe_name: recipe,
                          count: recipe_count,
                          keepStocked: keepStocked,
                          imagePath: imagePath,
                          ingredient_list: ingredients,
                          instructions: instructions });
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ ValidateIsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/recipes/' + recipeName,
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
        <Header history={ this.props.history }
                inner={ "Recipe" }
                isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className="w3-content ">
            { this.state.recipe_name ? (<p className="w3-card"><b>{ this.state.recipe_name }</b>
                                          <span className={"w3-right w3-badge "+color.random()}>
                                            { this.state.count }
                                          </span>
                                        </p>): '' }
            <div className="w3-card w3-bar w3-margin-bottom  w3-xlarge">
              <label className="w3-tooltip" htmlFor="picture" aria-label="take a picture">
                <i className={"w3-btn w3-hover-yellow fas fa-camera" +
                              (this.state.pictureIsLoading ? "fa-spin" : "") }
                              aria-hidden="true"></i>
                <span className="w3-text">Change/Add a picture</span>
              </label>
              <input type="file"
                     id="picture"
                     style={{display: "none"}}
                     name="uploadPicture"
                     accept="image/*"
                     capture
                     onChange={ this.state.pictureIsLoading ? undefined :
                                (event) => this.handlePictureUpload(event.target.files) } />
              <label className="w3-tooltip">
                <Link to={ '/recipes/' + this.state.recipe_name } >
                    <i className="w3-btn w3-hover-yellow fas fa-edit" aria-hidden="true"></i>
                </Link>
                <span className="w3-text">Edit/Delete Recipe</span>
              </label>
              <label className="w3-tooltip" aria-label="keep this recipe stocked" aria-hidden="true">
                <button className={"w3-btn w3-hover-yellow " +
                        (this.state.keepStocked ? "w3-yellow" : "") }
                        onClick={ () => this.stock_recipe() }>
                  <i className="fas fa-cart-arrow-down"></i>
                </button>
                <span className="w3-text">Keep this on my shopping list.</span>
              </label>
              <label className="w3-tooltip" aria-label="shopping list" aria-hidden="true">
                <button className={"w3-btn w3-hover-yellow " +
                                   (this.state.subtracted ? "w3-yellow" : "") }
                        onClick={ () => this.subtract_ingredients() } >
                  <i className="fas fa-utensils"></i>
                </button>
                <span className="w3-text">I ate this food!</span>
              </label>
            </div>
            <div className="w3-display-container" >
              { thumbnail(this.state) }
              { this.state.imagePath ? (
                    <button className={"fas fa-trash-alt w3-xlarge " +
                                       "w3-display-bottomright w3-display-hover w3-margin " +
                                       "w3-btn w3-opacity w3-orange"}
                            onClick={ (event) => this.deletePicture(event) }/>) : ""}

            </div>
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
