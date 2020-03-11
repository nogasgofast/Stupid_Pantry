import React from 'react';
import { Link, Redirect, withRouter } from "react-router-dom";
import { Header } from './header.js';
import { GroupActionList, GroupActionItem, Request, W3Color } from './utils.js';

export class ActionRecipe extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isLoading: false
    }
    this.myIsMounted = false;
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.myIsMounted = true;
  }
  componentWillUnmount() {
    this.myIsMounted = false;
  }

  handleSubmit(){
    let method = this.props.isEdit ? 'PUT' : 'POST' ;
    let data = this.props.isEdit ? JSON.stringify({newName: this.props.newName,
                               ingredients: this.props.ingredients,
                               instructions: this.props.instructions}) :
                               JSON.stringify({recipeName: this.props.newName,
                               ingredients: this.props.ingredients,
                               instructions: this.props.instructions}) ;

    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && (status == 201 || status == 200)) {
        if (this.myIsMounted) {
          this.setState({ isLoading: false });
          this.props.history.goBack();
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        if (status == 409){
          alert("duplicate entry");
        }
        this.setState({ IsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/recipes' + (this.props.isEdit ? '/'+this.props.name : '') ,
      data: data,
      method: method,
      callBack: callBack,
      headers: {"content-type": "application/json"},
      accessToken: this.props.accessToken,
      refreshToken: this.props.refreshToken,
      isNotLoggedIn: this.props.isNotLoggedIn,
      updateAccessToken: this.props.updateAccessToken};
    console.log(settings);
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ValidateIsLoading: true});
    };
  }

  isDone(){
    let flag = true;
    if ( this.props.ingredients.length == 0){
      return false
    }
    for (const item of this.props.ingredients){
      if (item.isMatching == 'some'){
        flag = false;
      }
    }
    return flag;
  }

  render() {
    return <>
              <button className={ ( !this.isDone() ?
                                  'w3-disabled w3-red ' :
                                  'w3-yellow ' ) +
                                "w3-btn w3-card w3-bar"}
                    style={ this.props.ingredients.length == 0 ?
                            {display: 'none'} :
                            {} }
                    onClick={ ()=>this.handleSubmit() } >
              { this.props.isEdit ? 'Edit': 'Add' } Recipe
              </button>
           </>
  }
}

export class InstructionsList extends GroupActionList {
  constructor(props){
    super(props);
    this.state = {
      buttons: new Set([{action: "delete" ,
                         image: <i className="fas fa-times"></i>,
                         do: () => this.deleteItems() }]),
      selectedItems: new Set()
    }
  }

  renderItem(item){
    return <li className={"w3-card w3-left-align " +
               (this.state.selectedItems.has(item) ?
               "w3-border-yellow w3-rightbar" :
               "")}
               key={ item }
               onClick={() => this.handleSelect(item)}>{ item }</li>
  }

  renderList(){
    let list = [];
    if (this.props.items.length == 0){
      return <div className="w3-yellow">Oops, put 'directions' above your list of directions. This is required</div>;
    }
    for (const item of this.props.items) {
      list.push(this.renderItem(item));
    }
    return list;
  }

  deleteItems(){
    const list = [];
    //rebuild list without selected items.
    for (const item of this.props.items ){
      if (!this.state.selectedItems.has(item)){
        list.push(item);
      }
    }
    this.props.instructionsUpdate(list);
    const slist = new Set();
    this.setState({selectedItems: slist});
  }
}

export class IngredientList extends GroupActionList {
  constructor(props){
    super(props);
    this.state ={
      buttons: new Set([]),
      selectedItems: new Set() };
  }

  renderItem(item, newColor) {
    const type = { no:'fa fa-plus',
                   perfect:'',
                   some:'fas fa-question'}
    const label = { no: ' new item!',
                    perfect: '',
                    some: ' choose one'}
    return <li className={ "w3-card " +
                           "w3-border-" +
                           (newColor ? newColor : 'yellow') +
                           (newColor ? ' w3-leftbar': "") +
                           " w3-row " +
                           (this.state.selectedItems.has(item.name) ? " w3-rightbar":"")}
                  onClick={ () => this.handleSelect(item.name) }
                  key={ item.name } >
                <div className="w3-column">{ item.name }</div>
                 <div className="w3-column w3-right-align">
                                <i className={ (item.isMatching ?
                                              type[item.isMatching] :
                                              type['some']) +
                                              " w3-large " }></i>
                {item.isMatching ? label[item.isMatching]: label['some']}</div>
          </li>
  }

  renderList(){
    let list = [];
    if (this.props.items.length == 0){
      return <div className="w3-yellow">Oops, put 'ingredients' above your list of ingredients. This is required</div>;
    }
    for (const item of this.props.items) {
      if (item["isMatching"] == 'some') {
        let color = new W3Color;
        const newColor = color.random();
        console.log(newColor)
        list.push(this.renderItem(item, newColor));
        for (const suggest of item['pantry']){
          //console.log(suggest);
          list.push(this.renderItem(suggest, newColor));
        }
      }else{
        list.push(this.renderItem(item, false));
      }
    }
    return list;
  }

  checkItems(){
    const list = [];
    for (let item of this.props.items ){
      if (item.isMatching == 'some'){
        const tempPantry = [];
        for (const subItem of item.pantry) {
          if (this.state.selectedItems.has(subItem.name)){
            tempPantry.push(subItem);
          }
        }
        if (tempPantry.length == 1){
          //one sub item selected from list.
          //use that and set isMatching on it.
          //Unless there is a conflicting selection with the parent:
          if (!this.state.selectedItems.has(item.name)){
            item = tempPantry[0];
            item.isMatching = 'perfect';
            item.pantry = tempPantry.splice();
          }
          //if there is a conflicting match do nothing!
        }
        else if (tempPantry.length == 0){
          // this is the case where the parent was selected
          // but non of the childern were.
          if (this.state.selectedItems.has(item.name)){
            item.pantry = [];
            item.isMatching = 'no';
          }
        }
        else {
          //if there is abiguity in the selection just keep what's selected.
          item.pantry = tempPantry;
        }
      }
      list.push(item);
    }
    this.props.ingredientUpdate(list);
    const slist = new Set();
    this.setState({selectedItems: slist});
  }

  deleteItems(){
    const list = [];
    //rebuild list without selected items.
    for (const item of this.props.items ){
      if (item.isMatching == 'some'){
        const tempPantry = [];
        for (const subItem of item.pantry) {
          if (!this.state.selectedItems.has(subItem.name)){
            tempPantry.push(subItem);
          }
        }
        if (tempPantry.length == 0){
          item.isMatching = 'no'
        }
        else {
          // there are options still available.
          if (this.state.selectedItems.has(item.name)){
            // but those options had their parent deleted and they are orphans now.
            if (tempPantry.length == 1){
              // but it was only one so that one became the only available match
              const subItem = tempPantry[0];
              subItem.isMatching = 'perfect';
              list.push(subItem);
            }
            else{
              // but there were many options and it's ambigious so keep everything.
              item.pantry = tempPantry;
              list.push(item);
            }
          }
          item.pantry = tempPantry;
        }
      }
      if (!this.state.selectedItems.has(item.name)){
        list.push(item);
      }
    }
    this.props.ingredientUpdate(list);
    const slist = new Set();
    this.setState({selectedItems: slist});
  }
}

// TODO: https://www.npmjs.com/package/react-avatar-editor

export class RecipeForm extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isFalied: false,
      isPaste: false,
      isUpload: false,
      isCopy: false,
      recipeField: '',
      addLink: true,
      viewHelp: true,
      ocrisLoading: false,
      ValidateIsLoading: false,
      DeleteIsLoading: false,
      isDeleted: false,
      isDuplicate: false,
      recipeName: '',
      newRecipeName: '',
      IngredientList: [],
      instructions: []
    };
    this.myIsMounted= false;
    // These are just handlers being registered with the running process.
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleLink = this.toggleLink.bind(this);
  }

  ingredientUpdate(list){
    this.setState({IngredientList: list});
  }
  instructionsUpdate(list){
    this.setState({instructions: list});
  }

  componentDidMount() {
    this.myIsMounted = true;
    if (this.checkCompatVideo()) {
      // Good to go!
    } else {
      console.log('This browser only supports uploading pre-saved images.');
    }
    if (this.props.isEdit) {
      this.renderThisRecipe();
    }
  }

  componentWillUnmount() {
    this.myIsMounted = false;
  }

  handleFileUpload(event){
    let files = event.target.files;
    for (let i = 0, f; f = files[i]; i++) {
      if (!f.type.match('text/.*')) {
        alert("Must be a text only file");
        continue;
      }
      let reader = new FileReader();
      // Closure to capture the file information.
      reader.onload = (e) => {
        if (this.myIsMounted) {
          this.setState({ recipeField: e.target.result });
        }
      };
      // Read in the image file as a data URL.
      reader.readAsText(f);
    }
  }

  handleImageUpload(files){
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
              this.setState({ ocrisLoading: false,
                              recipeField: recipeText });
            }
          } else if (state == 4 && cat != '2' && cat != '3') {
            this.setState({ ocrisLoading: false,
                            recipeField: xhr.responseText });
          }
        };

        let formData = new FormData();
        //console.log(f);
        formData.append('file', f , f.name );
        //console.log(formData.has('file'))
        const settings = {
          url: '/v1/recipes/ocr',
          data: formData,
          isFileUpload: true,
          method: 'POST',
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
          this.setState({ocrisLoading: true});
        }
      }
    }
  }

  handleRecipeChange(event){
    if (this.myIsMounted){
      this.setState({ recipeField: event.target.value })
    }
  }

  toggleLink(){
    this.setState({ addLink: !this.state.addLink })
  }

  toggleHelp(){
    this.setState({ viewHelp: !this.state.viewHelp })
  }


  checkCompatVideo(){
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  handleSubmit(event){
    event.preventDefault();
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        const recipe = JSON.parse(xhr.responseText)['recipe'];
        if (this.myIsMounted) {
          this.setState({ ocrisLoading: false,
                          newRecipeName: recipe['name'],
                          isDuplicate: recipe['isDuplicate'],
                          IngredientList: recipe['ingredients'],
                          instructions: recipe['instructions'] });
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        if (cat == 4){
          this.setState({ newRecipeName: "Error:",
                          ValidateIsLoading: false});
          console.log( xhr.responseText );
        }else {
          this.setState({ ValidateIsLoading: false});
          console.log( xhr.responseText );
        }
      }};
    const settings = {
      url: '/v1/recipes/parse',
      data: JSON.stringify({"recipe": this.state.recipeField }),
      method: 'POST',
      callBack: callBack,
      headers: {"content-type": "application/json"},
      accessToken: this.props.accessToken,
      refreshToken: this.props.refreshToken,
      isNotLoggedIn: this.props.isNotLoggedIn,
      updateAccessToken: this.props.updateAccessToken};
    //console.log(settings)
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ValidateIsLoading: true});
    };
  }

  handleDelete(event){
    event.preventDefault();
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        const recipe = JSON.parse(xhr.responseText)['recipe'];
        if (this.myIsMounted) {
          this.setState({ DeleteIsLoading: false,
                          isDeleted: true });

        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ DeleteIsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/recipes/' + this.state.recipeName,
      data: JSON.stringify({"recipe": this.state.recipeField }),
      method: 'DELETE',
      callBack: callBack,
      headers: {"content-type": "application/json"},
      accessToken: this.props.accessToken,
      refreshToken: this.props.refreshToken,
      isNotLoggedIn: this.props.isNotLoggedIn,
      updateAccessToken: this.props.updateAccessToken};
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({DeleteIsLoading: true});
    };
  }

  renderThisRecipe(){
    //console.log(this.props.location);
    const {pathname} = this.props.location;
    //console.log(pathname);
    const recipeName = pathname.replace('/recipes/', '')
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
          if (x['amountMeasure'] == x['name']){
            return  x['amount'] +' '+ x['amountMeasure']}
          else{
            return x['amount'] +' '+ x['amountMeasure'] +' '+ x['name']
          }
        }
        let ingredientsDisplay = ingredients.map( x => dedupDisplay(x) );
        let instructions = JSON.parse(xhr.responseText)['instructions'];
        let recipeText = recipe.concat('\n',
                                       '\n',
                                      'Ingredients',
                                      '\n',
                                      ingredientsDisplay.join('\n'),
                                      '\n',
                                      '\n',
                                      'Directions',
                                      '\n',
                                      instructions);
        instructions = instructions.split('\n');
        if (this.myIsMounted) {

          this.setState({ ValidateIsLoading: false,
                          recipeName: recipe,
                          recipeField: recipeText});
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
        <Header history={ this.props.history }
                inner={ (this.props.isEdit ? 'Edit': 'Add')+" Recipe" }
                isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-content " } >
            { this.state.recipeName ? (<p className="w3-card"><b>{ this.state.recipeName }</b></p>): '' }
            <div className="w3-bar w3-card w3-margin-bottom w3-xlarge">
              { this.state.ocrisLoading &&
                <>
                  <label htmlFor="OCR" aria-label="use picture">
                    <i className="w3-btn w3-hover-yellow fa fas fa-print fa-spin" aria-hidden="true"></i>
                  </label>
                  <input type="file"
                         id="OCR"
                         style={{display: "none"}}
                         name="uploadedfile"
                         accept="image/*"
                         capture
                         />
                </>
              }
              { !this.state.ocrisLoading &&
                <>
                  <label className="w3-tooltip" htmlFor="OCR" aria-label="use picture">
                    <i className="w3-btn w3-hover-yellow fas fa-print" aria-hidden="true"></i>
                    <span className="w3-text">Use Camera or Picture</span>
                  </label>
                  <input type="file"
                         id="OCR"
                         style={{display: "none"}}
                         name="uploadedfile"
                         accept="image/*"
                         capture
                         onChange={ (event) => this.handleImageUpload(event.target.files)}
                         />
                </>
              }
              <label className="w3-tooltip" htmlFor="addLink" aria-label="use link">
                <button id="addLink" className="w3-btn w3-hover-yellow fas fa-link"
                      onClick={() => this.toggleLink() } >
                </button>
                <span className="w3-text">Link to a Recipe</span>
              </label>
              <label className="w3-tooltip" htmlFor="upload" aria-label="file upload">
                <i className="w3-btn w3-hover-yellow fas fa-file-word" aria-hidden="true"></i>
                <span className="w3-text">Upload a File</span>
              </label>
              <input type="file"
                     style={{display: "none"}}
                     id="upload"
                     onChange={ (event) => this.handleFileUpload(event)}
                     />
              {this.props.isEdit ?
                  (<>
                    <label className="w3-tooltip" htmlFor="delete" aria-label="delete this recipe">
                      <i className="w3-btn w3-hover-yellow fas fa-trash-alt" aria-hidden="true"></i>
                      <span className="w3-text">Delete Recipe</span>
                    </label>
                    <button style={{display: "none"}}
                         id="delete"
                         onClick={ (event) => this.handleDelete(event)}
                         />
                    </>
                  ) : '' }
              { this.state.isDeleted && <Redirect to='/recipes' / > }
            </div>
            <div hidden={ this.state.addLink } >
              <input id="addLink"
                     type="text"
                     placeholder="https://"
                     className="w3-input"
                      onChange={ (event)=> this.handleLinkChange(event) }/>
              <label htmlFor="readlink" aria-label="copy the recipie from this link">
              </label>
              <button className="w3-input w3-btn w3-orange w3-margin-bottom w3-hover-yellow"
                      onClick={()=>this.readlink()}>
                Read Link
              </button>
            </div>
            <form method="POST"
                  className={"w3-card " +
                             "w3-round-large" +
                             "w3-form "}
                  onSubmit={(event) => this.handleSubmit(event)} >
              <b>
              <textarea rows="15"
                        className="w3-input w3-margin-16"
                        onChange={(e) => this.handleRecipeChange(e) }
                        placeholder={"Bacon and egg tacos\n" +
                                     "\n" +
                                     "ingredients\n" +
                                     "1 slice bacon\n" +
                                     "3 eggs\n" +
                                     "2 tortillas\n"+
                                     "\n" +
                                     "directions\n"+
                                     "First scrabble the eggs, cook and season\n"+
                                     "second warm up the tortillas on a pan\n"+
                                     "third plate tortillas fill with 1 bacon slice and half the egg\n"}
                        value={ this.state.recipeField } ></textarea></b>
              <input  type="submit"
                      value={ !this.props.isLoading ? "Review Recipe" : (<i className="fa fa-cog fa-spin fa-fw fa-3x"></i>) }
                      className="w3-btn w3-orange w3-input w3-block w3-hover-yellow" />
            </form>
            { this.state.newRecipeName ? (<p><b>Name:{ this.state.newRecipeName }</b></p>): '' }
            { this.state.newRecipeName ? (<p>Looking for matching ingredients...</p>): '' }
            { this.state.newRecipeName ? (
                <IngredientList items={ this.state.IngredientList }
                                 ingredientUpdate={(list)=>this.ingredientUpdate(list)}
                                 />):"" }
            <div className={"w3-padding"}></div>
            { this.state.newRecipeName ? <p><b>Directions</b></p> : "" }
            { this.state.newRecipeName ? (
                <InstructionsList items={ this.state.instructions }
                                   instructionsUpdate={(list)=>this.instructionsUpdate(list)}/>):"" }
            <div className={"w3-padding"}></div>
            <ActionRecipe
                        {...this.props}
                        name={ this.state.recipeName }
                        newName={ this.state.newRecipeName }
                        ingredients={ this.state.IngredientList }
                        instructions={ this.state.instructions }/>
          </div>
        </div>
      </>
    )
  }
}
