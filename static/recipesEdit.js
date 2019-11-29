import React from 'react';
import { Link, Redirect } from "react-router-dom";
import { Header } from './header.js';
import { GroupActionList, GroupActionItem, Request } from './utils.js';

class Add_Recipe extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isLoading: false,
      redirect: false
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
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 201) {
        if (this.myIsMounted) {
          this.setState({ isLoading: false,
                          redirect: true });
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ IsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/recipes',
      data: JSON.stringify({recipe_name: this.props.name,
                            ingredients: this.props.ingredients,
                            instructions: this.props.instructions}),
      method: 'POST',
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
      this.setState({ValidateIsLoading: true});
    };
  }

  is_done(){
    let flag = true;
    if ( this.props.ingredients.length == 0){
      return false
    }
    for (const item of this.props.ingredients){
      if (item.is_matching == 'some'){
        flag = false;
      }
    }
    return flag;
  }

  render() {
    return <div className={"w3-container w3-card"}
                style={ this.props.ingredients.length == 0 ?
                        {display: 'none'} :
                        {} }>
             <button className={ ( !this.is_done() ?
                                  'w3-dissabled w3-red ' :
                                  'w3-yellow ' ) +
                                "w3-btn"}
                    onClick={ ()=>this.handleSubmit() } >
               Add Recipe
             </button>
             { this.state.redirect ? (<Redirect to='/recipes' />) : ''}
           </div>
  }
}

class Instructions_List extends GroupActionList {
  constructor(props){
    super(props);
    this.state = {
      buttons: new Set([{action: "delete" ,
                         image: <i className="fas fa-times"></i>,
                         do: () => this.delete_items() }]),
      selectedItems: new Set()
    }
  }

  render_item(item){
    return <li className={"w3-card w3-left-align " +
               (this.state.selectedItems.has(item) ?
               "w3-border-yellow w3-rightbar" :
               "")}
               key={ item }
               onClick={() => this.handleSelect(item)}>{ item }</li>
  }

  renderList(){
    let list = [];
    for (const item of this.props.items) {
      list.push(this.render_item(item));
    }
    return list;
  }

  delete_items(){
    const list = [];
    //rebuild list without selected items.
    for (const item of this.props.items ){
      if (!this.state.selectedItems.has(item)){
        list.push(item);
      }
    }
    this.props.instructions_update(list);
    const slist = new Set();
    this.setState({selectedItems: slist});
  }
}

class Ingredient_List extends GroupActionList {
  constructor(props){
    super(props);
    this.state ={
      buttons: new Set(
        [{action: "delete" ,
         image: <i className="fas fa-times"></i>,
         do: () => this.delete_items() },
        {action: "edit" ,
         image: <i className="fas fa-check"></i>,
         do: () => this.check_items() }]),
      selectedItems: new Set() };
  }

  renderItem(item) {
    const type = { no:'fa fa-plus',
                   perfect:'fas fa-link',
                   some:'fas fa-question'}
    return <li className={ "w3-card w3-border-yellow " +
                  (this.state.selectedItems.has(item.name)? "w3-rightbar":"")}
                  onClick={ () => this.handleSelect(item.name) }
                  key={ item.name } >
                { item.name } <i className={ (item.is_matching ?
                                              type[item.is_matching] :
                                              type['some']) +
                " w3-right " +
                " w3-large"}></i>
          </li>
  }

  renderList(){
    let list = [];
    for (const item of this.props.items) {
      list.push(this.renderItem(item));
      if (item["is_matching"] == 'some') {
        for (const suggest of item['pantry']){
          //console.log(suggest);
          list.push(this.renderItem(suggest));
        }
      }
    }
    return list;
  }

  check_items(){
    const list = [];
    for (let item of this.props.items ){
      if (item.is_matching == 'some'){
        const tempPantry = [];
        for (const subItem of item.pantry) {
          if (this.state.selectedItems.has(subItem.name)){
            tempPantry.push(subItem);
          }
        }
        if (tempPantry.length == 1){
          //one sub item selected from list.
          //use that and set is_matching on it.
          //Unless there is a conflicting selection with the parent:
          if (!this.state.selectedItems.has(item.name)){
            item = tempPantry[0];
            item.is_matching = 'perfect';
            item.pantry = tempPantry.splice();
          }
          //if there is a conflicting match do nothing!
        }
        else if (tempPantry.length == 0){
          // this is the case where the parent was selected
          // but non of the childern were.
          if (this.state.selectedItems.has(item.name)){
            item.pantry = [];
            item.is_matching = 'no';
          }
        }
        else {
          //if there is abiguity in the selection just keep what's selected.
          item.pantry = tempPantry;
        }
      }
      list.push(item);
    }
    this.props.ingredient_update(list);
    const slist = new Set();
    this.setState({selectedItems: slist});
  }

  delete_items(){
    const list = [];
    //rebuild list without selected items.
    for (const item of this.props.items ){
      if (item.is_matching == 'some'){
        const tempPantry = [];
        for (const subItem of item.pantry) {
          if (!this.state.selectedItems.has(subItem.name)){
            tempPantry.push(subItem);
          }
        }
        if (tempPantry.length == 0){
          item.is_matching = 'no'
        }
        else {
          // there are options still available.
          if (this.state.selectedItems.has(item.name)){
            // but those options had their parent deleted and they are orphans now.
            if (tempPantry.length == 1){
              // but it was only one so that one became the only available match
              const subItem = tempPantry[0];
              subItem.is_matching = 'perfect';
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
    this.props.ingredient_update(list);
    const slist = new Set();
    this.setState({selectedItems: slist});
  }
}

export class RecipesEdit extends React.Component {
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
      is_duplicate: false,
      recipe_name: '',
      ingredient_list: [],
      instructions: []
    };
    this.myIsMounted= false;
    // These are just handlers being registered with the running process.
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleLink = this.toggleLink.bind(this);
  }

  ingredient_update(list){
    this.setState({ingredient_list: list});
  }
  instructions_update(list){
    this.setState({instructions: list});
  }

  componentDidMount() {
    this.myIsMounted = true;
    if (this.check_compat_video()) {
      // Good to go!
    } else {
      console.log('This browser only supports uploading pre-saved images.');
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
          is_file_upload: true,
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


  check_compat_video(){
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
                          recipe_name: recipe['name'],
                          is_duplicate: recipe['is_duplicate'],
                          ingredient_list: recipe['ingredients'],
                          instructions: recipe['instructions'] });
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ ValidateIsLoading: false});
        console.log( xhr.responseText );
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
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ValidateIsLoading: true});
    };
    //const list = this.state.ingredient_list ;
    // 'unknown', 'match', 'suggest'
    //list.push( new GroupActionItem("hello A really really really", 'unknown'));
    //list.push( new GroupActionItem("my super duper long", 'match'));
    //list.push( new GroupActionItem("pretty amazing and extravigent...", 'suggest'));
    //this.setState({ ingredient_list: list })
  }

  render() {
    return(
      <>
        <Header inner="Edit Recipe" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-center " +
                          "w3-content " +
                          "w3-mobile "} >
            <form method="POST"
                  className={"w3-card " +
                             "w3-form "}
                  onSubmit={(event) => this.handleSubmit(event)} >
              <div className="w3-bar w3-center w3-padding w3-xlarge">
                { this.state.ocrisLoading &&
                  <>
                    <label htmlFor="OCR" aria-label="use picture">
                      <i className="w3-btn w3-hover-yellow fa fas fa-camera fa-spin" aria-hidden="true"></i>
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
                    <label htmlFor="OCR" aria-label="use picture">
                      <i className="w3-btn w3-hover-yellow fas fa-camera" aria-hidden="true"></i>
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
                <label htmlFor="addLink" aria-label="use link">
                  <button id="addLink" className="w3-btn w3-hover-yellow fas fa-link"
                        onClick={() => this.toggleLink() } >
                  </button>
                </label>

                <label htmlFor="upload" aria-label="file upload">
                  <i className="w3-btn w3-hover-yellow fas fa-file-word" aria-hidden="true"></i>
                </label>
                <input type="file"
                       style={{display: "none"}}
                       id="upload"
                       onChange={ (event) => this.handleFileUpload(event)}
                       />
                <label htmlFor="help" hidden={true}>
                  help
                </label>
                <Link name="help"
                      className="w3-bar-item w3-right w3-btn w3-hover-yellow"
                      to='#'
                      onClick={ () => this.toggleHelp() } >
                  <i className="far fa-question-circle"></i>
                </Link>
              </div>
              <div hidden={ this.state.addLink } >
                <input id="addLink"
                       type="text"
                       placeholder="https://"
                       className="w3-input"
                        onChange={ (event)=> this.handleLinkChange(event) }/>
                <label htmlFor="readlink" aria-label="copy the recipie from this link">
                </label>
                <button className="w3-input w3-btn  w3-margin-bottom w3-hover-yellow"
                        onClick={()=>this.readlink()}>
                  Read Link
                </button>
              </div>
              <div className="w3-left-align" hidden={ this.state.viewHelp } >
                Having problems?<br />Make sure you follow this template as closely as possibe.<br />
                <Link to="help">Or click here for the specifics</Link>
                <div className="w3-light-gray">
                  Bacon and Egg tacos<br />
                  <br />
                  ingredients<br />
                  1 pinch salt<br />
                  1 pinch pepper<br />
                  1 slice bacon<br />
                  2 eggs<br />
                  1 tortilla<br />
                  <br />
                  directions<br />
                  Cook the bacon in a pan.<br />
                  Drain grease leaving some in the pan.<br />
                  Scramble 2 eggs put aside keep warm if possible.<br />
                  Toast tortilla in pan, some bubbles may form before done toasting.<br />
                  Plate by putting down toasted tortilla, eggs on top, then bacon. salt and pepper as desired.
                </div>
              </div>
              <textarea rows="15"
                        className="w3-input w3-margin-16"
                        onChange={(e) => this.handleRecipeChange(e) }
                        placeholder="Paste Recipe here. You can also use the buttons above to import from a picture,web link, or plain text file."
                        value={ this.state.recipeField } ></textarea>
              <input  type="submit"
                      value={ !this.props.isLoading ? "Review Recipe" : (<i className="fa fa-cog fa-spin fa-fw fa-3x"></i>) }
                      className="w3-btn w3-block w3-hover-yellow" />
            </form>
            <div className="w3-left-align" hidden={ this.state.viewHelp } >
               Once you click "Review Recipe" you will see a form below.
               You can click on the items and delete them before Adding the recipe.
               If you see '?' on ingredients this means you need to choose one of the
               given options.
               <Link to="help">Click here for the specifics</Link>
            </div>
            { this.state.recipe_name ? (<p><b>{ this.state.recipe_name }</b></p>): '' }
            { this.state.is_duplicate ?
              (<Link to={'recipes/'+this.state.recipe_name}>
                 <button className={"w3-btn w3-orange"}>Duplicate</button></Link>) :
              (<>
                <Ingredient_List items={ this.state.ingredient_list }
                              ingredient_update={(list)=>this.ingredient_update(list)}/>
                <div className={"w3-padding"}></div>
                <Instructions_List items={ this.state.instructions }
                              instructions_update={(list)=>this.instructions_update(list)}/>
                <div className={"w3-padding"}></div>
                <Add_Recipe name={ this.state.recipe_name }
                            ingredients={ this.state.ingredient_list }
                            instructions={ this.state.instructions }
                            accessToken={ this.props.accessToken }
                            refreshToken={ this.props.refreshToken }
                            isNotLoggedIn={ this.props.isNotLoggedIn }
                            updateAccessToken={ this.props.updateAccessToken} />
              </>)}
          </div>
        </div>
      </>
    )
  }
}