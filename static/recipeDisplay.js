import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { LinkDispList, Request, W3Color, thumbnail } from './utils.js';

const color = new W3Color;

export class InstructionsListDisp extends LinkDispList {
  renderItem(item){
    return <li className={ "w3-card w3-left-align " }
               key={ item }>{ item }</li>
  }
}

export class IngredientListDisp extends LinkDispList {
  renderItem(item) {
    //console.log(item)
    let viewAmount = 0
    let dispName = ''
    let color = 'w3-green'
    item.viewAmount > 1 ? viewAmount = 1 : viewAmount = item.viewAmount
    if ( viewAmount <= 0.5 ){
      color = 'w3-yellow'
    }
    if ( viewAmount <= 0.25){
      color = 'w3-red'
    }
    //this just checks for duplicates like "lemon lemons and prevents them from displaying."
    //console.log(item.name + " " + item.amountMeasure)
    if ( item.name == item.amountMeasure.slice(0, -1) ||
         item.name == item.amountMeasure){
      dispName = item.amountMeasure
    }else{
      dispName = item.amountMeasure + " " + item.name
    }

    return  <Link key={ item.name } to={'/pantry/' + item.name } >
                <li className={ "w3-card w3-border-yellow" }>
                  { item.amount + " " + dispName }
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
      isStocking: false,
      keepStocked: false,
      isSubtracting: false,
      subtracted: false,
      isPublic: false,
      isPublicLoading: false,
      pictureIsLoading: false,
      recipeName: '',
      imagePath: '',
      ingredientList: [],
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

    togglePublic() {
        event.preventDefault();
        let callBack = (xhr) => {
          //console.log(xhr.responseText);
          let state = xhr.readyState;
          let status = xhr.status;
          let cat = Math.floor(status/100);
          if ((state == 4) && status == 200) {
            const isPublic = JSON.parse(xhr.responseText)['public']
            if (this.myIsMounted) {
              this.setState({ isPublicLoading: false,
                              isPublic: isPublic,
                              imagePath: '' });
            }
          } else if (state == 4 && cat != '2' && cat != '3') {
            this.setState({ isPublicLoading: false });
            console.log(xhr.responseText);
          }
        };
        const settings = {
          url: '/v1/recipes/togglePublic/' + this.state.recipeName,
          data: '{}',
          method: 'POST',
          callBack: callBack,
          history: this.props.history
        };
        let req = new Request();
        req.props = settings;
        req.withAuth();
        if (this.myIsMounted) {
          this.setState({isPublicLoading: true});
        }
    }

  deletePicture(event){
    event.preventDefault();
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
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
      url: '/v1/recipe/image/' + this.state.recipeName,
      data: '{}',
      method: 'DELETE',
      callBack: callBack,
      history: this.props.history
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
            let maxWidth = 1200;
            let maxHeight = 1600;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
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
                url: '/v1/recipe/image/' + this.state.recipeName,
                data: formData,
                isFileUpload: true,
                method: 'POST',
                callBack: callBack,
                history: this.props.history
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

  subtractIngredients() {
    let name = this.state.recipeName;
    let callBack = (xhr) => {
        //console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        if(this.myIsMounted) {
          this.setState({
            isSubtracting: false,
            subtracted:  true
          });
          this.renderThisRecipe();
        }
      } else if (xhr.readyState == 4){
        this.setState({ isSubtracting: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/inventory/use/' + this.state.recipeName,
      data: '{}',
      method: 'PUT',
      callBack: callBack,
      history: this.props.history
    };
    this.setState({isSubtracting: true});
    let req = new Request(settings);
    req.withAuth();
  }

  stockRecipe() {
    let name = this.state.recipeName;
    let callBack = (xhr) => {
        //console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        if(this.myIsMounted) {
          const keepStocked = !this.state.keepStocked;
          this.setState({
            isStocking: false,
            keepStocked:  keepStocked
          });
        }
      } else if (xhr.readyState == 4){
        this.setState({ isStocking: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/requirements/' + this.state.recipeName,
      data: '{}',
      method: 'PUT',
      callBack: callBack,
      history: this.props.history
    };
    this.setState({isStocking: true});
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
        const recipeCount = JSON.parse(xhr.responseText)['value'];
        const keepStocked = JSON.parse(xhr.responseText)['keepStocked'];
        const isPublic = JSON.parse(xhr.responseText)['public']
        let ingredients = JSON.parse(xhr.responseText)['ingredients'];
        let instructions = JSON.parse(xhr.responseText)['instructions'];
        const imagePath = JSON.parse(xhr.responseText)['imagePath'];
        instructions = instructions.split('\n');
        if (this.myIsMounted) {
          this.setState({ recipeName: recipe,
                          count: recipeCount,
                          keepStocked: keepStocked,
                          isPublic: isPublic,
                          imagePath: imagePath,
                          ingredientList: ingredients,
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
      history: this.props.history
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ValidateIsLoading: true});
    };
  }

    render() {return(<>
        <Header history={ this.props.history } inner={ "Recipe" } />
        <div className="w3-margin w3-row-padding">
            <div className="w3-content ">
                {this.state.recipeName ? (<p className="w3-card"><b>{ this.state.recipeName }</b><br />
                                            Meals available:
                                            <span className={"w3-badge "+color.random()}>
                                                { this.state.count }</span></p>)
                : '' }
                <div className="w3-row">
                    <div className="w3-dropdown-hover w3-third w3-margin-bottom">
                        <button className="w3-button w3-bar">
                            <i className="w3-left w3-xlarge fas fa-carrot"> Options</i></button>
                        <div className="w3-bar-block w3-dropdown-content">
                            <div className="w3-bar" onClick={ () => this.togglePublic() }>
                              <i className={(this.state.isPublic ? " w3-yellow" : "") +
                                            (this.state.isPublicLoading ? " fa-spin" : "") +
                                            " w3-left w3-bar-item w3-button w3-hover-yellow" +
                                            " w3-xlarge" +
                                            (this.state.isPublic ? " fas fa-eye": " fas fa-eye-slash")}
                                > Make {this.state.isPublic ? "Private" : "Public"}</i></div>
                            <label className="w3-bar" htmlFor="picture" aria-label="Add a picture">
                                <i className={"w3-left w3-bar-item w3-button w3-xlarge w3-hover-yellow fas fa-camera" +
                                              (this.state.pictureIsLoading ? "fa-spin" : "") }
                                              aria-hidden="true"> Add a picture</i></label>
                                <input type="file"
                                     id="picture"
                                     style={{display: "none"}}
                                     name="uploadPicture"
                                     accept="image/*"
                                     capture
                                     onChange={ this.state.pictureIsLoading ? undefined :
                                                (event) => this.handlePictureUpload(event.target.files) } />
                                <Link className="w3-bar" to={ '/recipes/edit/' + this.state.recipeName } >
                                    <i className={"w3-left w3-bar-item w3-button" +
                                                " w3-xlarge w3-hover-yellow fas fa-edit"}
                                       aria-hidden="true"> Edit Recipe</i></Link>
                                <div className="w3-bar" onClick={ () => this.stockRecipe() }>
                                    <i className={(this.state.keepStocked ? "w3-yellow " : "") +
                                              " w3-left w3-bar-item w3-button w3-hover-yellow" +
                                              " w3-xlarge fas fa-cart-arrow-down"}> Keep Stocked</i></div>
                                <div className="w3-bar" onClick={ () => this.subtractIngredients() }>
                                    <i className={(this.state.subtracted ? "w3-yellow" : "") +
                                                  " w3-left w3-bar-item w3-button w3-hover-yellow " +
                                                  " w3-xlarge fas fa-utensils"}> Use Ingredients</i></div></div></div></div>
                <div className="w3-display-container" >
                    { thumbnail(this.state) }
                    { this.state.imagePath ? (
                        <button className={"fas fa-trash-alt w3-xlarge " +
                                           "w3-display-bottomright w3-display-hover w3-margin " +
                                           "w3-btn w3-opacity w3-orange"}
                                onClick={ (event) => this.deletePicture(event) }/>) : ""}</div>
                <IngredientListDisp items={ this.state.ingredientList }
                              ingredientUpdate={(list)=>this.ingredientUpdate(list)}/>
                <div className={"w3-padding"}></div>
                <InstructionsListDisp items={ this.state.instructions }
                                      instructionsUpdate={(list)=>this.instructionsUpdate(list)}/>
                <div className={"w3-padding"}></div></div></div></>)}}
