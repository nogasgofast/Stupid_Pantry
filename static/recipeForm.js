import React from 'react';
import { Link, Redirect, withRouter } from "react-router-dom";
import { Header } from './header.js';
import { LinkDispList, Request, W3Color, CONVERT__ } from './utils.js';

export class ActionRecipe extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            isLoading: false}
        this.myIsMounted = false
        this.handleSubmit = this.handleSubmit.bind(this)}

    componentDidMount() {
        this.myIsMounted = true}

    componentWillUnmount() {
        this.myIsMounted = false}

    handleSubmit(){
        let method = this.props.isEdit ? 'PUT' : 'POST' ;
        let data = this.props.isEdit ?
                       JSON.stringify({
                           newName: this.props.newName,
                           ingredients: this.props.ingredients,
                           instructions: this.props.instructions})
                    :
                       JSON.stringify({
                           recipeName: this.props.newName,
                           ingredients: this.props.ingredients,
                           instructions: this.props.instructions})
        let callBack = (xhr) => {
            //console.log(xhr.responseText);
            let state = xhr.readyState;
            let status = xhr.status;
            let cat = Math.floor(status/100);
            if ((state == 4) && (status == 201 || status == 200)) {
                if (this.myIsMounted) {
                    this.setState({ isLoading: false });
                    //console.log("history length: " + String(this.props.history.length))
                    if(this.props.isEdit) {
                        this.props.history.goBack()}
                    else {
                        this.props.history.push('/recipes/')}}}
            else if (state == 4 && cat != 2 && cat != 3) {
                if (status == 409){
                    alert("duplicate entry")}
                this.setState({ IsLoading: false})
                console.log( xhr.responseText )}}
        const settings = {
            url: '/v1/recipes' + (this.props.isEdit ? '/'+this.props.name : ''),
            data: data,
            method: method,
            callBack: callBack,
            history: this.props.history,
            headers: {"content-type": "application/json"}}
        //console.log(settings)
        let req = new Request()
        req.props = settings
        req.withAuth()
        if (this.myIsMounted) {
            this.setState({ isLoading: true})}}

    isDone(){
        let flag = true
        if ( this.props.ingredients.length == 0){
            return false}
        for (const item of this.props.ingredients){
            if (item.isMatching == 'some'){
                flag = false}}
        return flag}

    render() {return <>

      <button className={(
                            !this.isDone() ?
                                'w3-disabled w3-red'
                            :
                                ' ' ) +
                                'w3-button w3-card w3-bar call-to-action'}
              style={
                    this.props.ingredients.length == 0 ?
                        {display: 'none'}
                    :
                        {}}
            onClick={()=>this.handleSubmit()} >
            {this.props.isEdit ? 'Edit': 'Add'}
            Recipe</button></>}}

export class InstructionsList extends LinkDispList {
  renderItem(item){
    return <li className={"w3-card w3-left-align " +
               (this.state.selectedItems.has(item) ?
               " w3-rightbar" :
               "")}
               key={ item }
               onClick={() => this.handleSelect(item)}>{ item }</li>
  }

  renderList(){
    let list = [];
    if (this.props.items.length == 0){
      return <div className="w3-yellow">Oh No! Directions are missing!</div>;
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

export class IngredientList extends LinkDispList {
    constructor(props){
        super(props);}


    renderAmountMeasure(item){
      let amount = 0
      let isMetered = CONVERT__[item.amountMeasure]
      return isMetered ? item.amountMeasure : ''}

    measureCorrectPlural(item){
      if (item.pantry[0].amount > 1 && (item.amountMeasure != null)) {
          return item.amountMeasure + "(s)"
      }else{
        return item.amountMeasure}
    }

    renderInPantry(item){
      //console.log(item)
      let amount = 0
      let isMetered = CONVERT__[item.amountMeasure]
      let text = ''
      let measure = ''
      if (item.isMatching && item.isMatching == 'perfect') {
          if (isMetered) {
              text = "In Panry: " + item.pantry[0].amount
              measure = this.measureCorrectPlural(item)}
          else {
              text = "In Panry: " + item.pantry[0].amount}
              measure = this.measureCorrectPlural(item)}
      else if (item.isMatching && item.isMatching == 'some') {
           text = "In Panry: " + "New"}
      else if (item.isMatching && item.isMatching == 'no') {
          text = "In Panry: " + "New" }
      else if (!item.isMatching) {
          if (isMetered) {
              text = "In Panry: " + item.amount
              measure = this.measureCorrectPlural(item)}
          else {
              text = "In Panry: " + item.amount
              measure = this.measureCorrectPlural(item)}}
      return <>{text}
               <span className="w3-margin-left">
               {measure}</span></>
    }

    renderUserInputWarning(item){
      if (item.isMatching && item.isMatching == 'some'){
        return <i className="w3-xxlarge w3-right fa-solid fa-triangle-exclamation" />}}

    renderItem(item) {
        const type = { no:'fa fa-plus',
                       perfect:'',
                       some:'fas fa-question'}
        const label = { no: ' new item!',
                        perfect: 'in pantry',
                        some: ' choose one'}
        return <li className="w3-card w3-row w3-margin-bottom"
                   key={ item.name }
                   onClick={()=>this.props.optionCallback(item)} >
                    <div className="w3-column w3-margin-bottom">
                      {item.dispAmount} {this.renderAmountMeasure(item)} {item.name}
                      {this.renderUserInputWarning(item)}
                      <br />
                      {this.renderInPantry(item)}
                    </div>
                </li>}

    renderList(name){
    let list = [];
    if (this.props.items.length == 0){
      return <div className="w3-yellow">oh No! Ingredients missing?</div>}
    for (const item of this.props.items) {
        list.push(this.renderItem(item))}
    return list}


    checkItems(name){
    //console.log("hi "+ name)
    const list = []
    for (let item of this.props.items ){
        if (item.isMatching == 'some'){
            const tempPantry = []
            for (const subItem of item.pantry) {
                if (name == subItem.name){
                    tempPantry.push(subItem)}}
            if (tempPantry.length == 1){
                //one sub item selected from list.
                //use that and set isMatching on it.
                //Unless there is a conflicting selection with the parent:
                if (name !== item.name){
                    item.name = tempPantry[0].name
                    item.isMatching = 'perfect'
                    item.pantry = tempPantry}}
            else if (tempPantry.length == 0){
                // this is the case where the parent was selected
                // but non of the childern were.
                if (name == item.name){
                    item.pantry = []
                    item.isMatching = 'no'}}
            else {
                //if there is abiguity in the selection just keep what's selected.
                item.name = tempPantry[0].name
                item.pantry = tempPantry}}
        list.push(item)}
    this.props.ingredientUpdate(list)}

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
        super(props)
        this.state = {
            modalItem: false,
            modalVisable: false,
            modalChoice: false,
            modalConversion: 1,
            modalNameSelect: 'Choose One',
            modalNameSelectBlank: false,
            modalConvertionMeasure: 'whole item(s)',
            recipeField: '',
            ocrisLoading: false,
            isLoading: false,
            DeleteIsLoading: false,
            isDeleted: false,
            isDuplicate: false,
            modalUndo: [],
            recipeName: '',
            newRecipeName: '',
            IngredientList: [],
            instructions: [],
            example: "Bacon and egg tacos\n" +
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
        this.myIsMounted= false
        // These are just handlers being registered with the running process.
        this.handleFileUpload = this.handleFileUpload.bind(this)
        this.handleImageUpload = this.handleImageUpload.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        const {pathname} = this.props.location
        //console.log(pathname)
        if (pathname.match('^/recipes/edit/.*')){
            this.renderThisRecipe()}
        if (pathname.match('^/public/recipes/.*')){
            this.renderThisRecipe()}}

    ingredientUpdate(list){
        this.setState({IngredientList: list})}

    instructionsUpdate(list){
        this.setState({instructions: list})}

    ingredientDeepCopy(ing){
        let savePoint = Object()
        savePoint.index = ing.index
        savePoint.alias = ing.alias
        savePoint.name = ing.name
        savePoint.isMatching = ing.isMatching
        savePoint.id = ing.id
        savePoint.pantry = ing.pantry
        return savePoint
    }

    handleModalClose(){
        this.setState({modalVisable: false})
    }

    handleModalUndo(){
        let item = this.state.modalItem
        let newList = this.state.IngredientList
        let newUndo = this.state.modalUndo
        this.state.IngredientList.forEach((element, index)=> {
            if (element.name == item.name){
                this.state.modalUndo.forEach((savePoint, pos)=>{
                    if (savePoint.index == index) {
                        element = this.ingredientDeepCopy(savePoint)
                        // the index is savePoint meta data
                        // its really not a property of an ingredient
                        delete element.index
                        newUndo.splice(pos, 1)
                    }})
                console.log(element)
                newList[index] = element}
        })
        this.setState({IngredientList: newList,
                       modalUndo: newUndo,
                       modalChoiceType: false,
                       modalNameSelect: 'Choose One',
                       modalVisable: false})
    }

    handleModalSave(){
        let newList = this.state.IngredientList
        let item = this.state.modalItem
        let history = this.state.modalUndo
        if (this.state.modalNameSelect != 'Choose One'){
            newList.forEach((ingredient, index)=> {
                if (ingredient.name == item.name) {
                    let savePoint = this.ingredientDeepCopy(ingredient)
                    savePoint.index = index
                    history.push(savePoint)
                    ingredient.alias = this.state.modalNameSelect
                    ingredient.conversion = this.state.modalConversion
                    ingredient.conversionMeasure = this.state.modalConvertionMeasure
                    ingredient.isMatching = 'perfect'
                    console.log('this is the saved item')
                    console.log(ingredient)
                    newList[index] = ingredient}
            })
            this.setState({modalNameSelectBlank: false,
                           IngredientList: newList,
                           modalVisable: false})
        } else {
            this.setState({modalNameSelectBlank: true})
        }

    }

    handleModalNameSelect(e){
        this.setState({modalNameSelect: e.target.value})
    }

    handleModalMeasureSelect(e){
        this.setState({modalConvertionMeasure: e.target.value})
    }

    renderModalMeasures() {
        let list = Object.keys(CONVERT__)
        list.push('whole item(s)')
        return <select value={this.state.modalConvertionMeasure}
                       className="w3-input w3-white"
                       onChange={(e)=>this.handleModalMeasureSelect(e)}>
                 {list.map((x)=><option key={x}>{x}</option>)}
               </select>
    }

    renderModalReplacements(){
        const visable = { name: 'none',
                           uses: 'none',
                           0: 'block',
                           false: 'block',
                           add: 'block',
                           replace: 'block'}
        let item = this.state.modalItem
        let list = []
        for (const rep in item.pantry) {
            // console.log(item.pantry[rep])
            list.push(
            <li key={ item.pantry[rep].name }
                className={this.renderModalClasses(item.pantry[rep].name)}
                onClick={()=>this.handleModalChoiceReplace(item.pantry[rep])}>
                Replace it with "{ item.pantry[rep].name }" from my pantry
            </li>)
        }
        return list
    }

    renderModalClasses(selectionKey){
        return "w3-input w3-hover-gray " + (this.state.modalChoiceType == selectionKey ?
                                  "w3-yellow":"")
    }

    handleModalChoiceReplace(replacement){
        // This just sets the type of thing thats happening.
        let history = this.state.modalUndo
        let newList = this.state.IngredientList
        newList.forEach((ingredient, index)=> {
            if (ingredient.name == this.state.modalItem.name) {
                let savePoint = this.ingredientDeepCopy(ingredient)
                savePoint.index = index
                history.push(savePoint)
                ingredient.name = replacement.name
                ingredient.id = replacement.id
                ingredient.isMatching = 'perfect'
                newList[index] = ingredient
            }
        })
        this.setState({modalChoiceType : 'replace',
                       IngredientList: newList,
                       modalUndo: history,
                       modalVisable: false,
                       modalNameSelect: 'Choose One',
                       modalConversion: 1,
                       modalConvertionMeasure: 'whole item(s)',
                       modalNameSelectBlank: false})
    }

    handleModalConversion(e){
        this.setState({modalConversion: e.target.value})
    }

    handleModalChoiceAdd(){
        // This just sets the type of thing thats happening.
        let item = this.state.modalItem
        let newList = this.state.IngredientList
        let history = this.state.modalUndo
        newList.forEach((ingredient, index)=> {
            if (ingredient.name == item.name) {
                let savePoint = this.ingredientDeepCopy(ingredient)
                savePoint.index = index
                history.push(savePoint)
                ingredient.isMatching = 'no'
                newList[index] = ingredient
            }
        })
        this.setState({IngredientList: newList,
                       modalVisable: false,
                       modalUndo: history,
                       modalNameSelect: 'Choose One',
                       modalConversion: 1,
                       modalConvertionMeasure: 'whole item(s)',
                       modalNameSelectBlank: false})
    }

    handleModalChoiceUses(){
        this.setState({modalChoiceType: 'uses',
                       modalNameSelect: 'Choose One',
                       modalConversion: 1,
                       modalConvertionMeasure: 'whole item(s)',
                       modalNameSelectBlank: false})
    }

    renderModalConversion(){
        return <input type='number'
                      size="3"
                      value={ this.state.modalConversion }
                      onChange={(e)=>this.handleModalConversion(e) } />
    }

    renderModalDropdown(item){
        return <select className={'w3-input '  + (
                            this.state.modalNameSelectBlank ? 'w3-border-red w3-bottombar '+
                            'w3-topbar w3-rightbar w3-leftbar' : ''
                        )}
                       value={this.state.modalNameSelect}
                       onChange={(e)=>this.handleModalNameSelect(e)}>
                         <option key="Choose One">Choose One</option>
                         {this.state.allIngs.map((option)=>
                           <option key={option.name}>{option.name}</option>)}
                </select>}

    renderModalOptions() {
        let item = this.state.modalItem
        const visable = { name: true,
                          uses: true}
        if (item){
        return <>
        <h2 className="w3-margin w3-border-bottom w3-border-white">
        For {item.name}...</h2>
        <ul className="w3-ul">
        <li className={this.renderModalClasses('add')}
            key='add'
            onClick={()=>this.handleModalChoiceAdd()}>
        Add it to my pantry.
        </li>
        { this.renderModalReplacements(item) }
        <li className={this.renderModalClasses('uses')}
            key='uses'
            onClick={ ()=>this.handleModalChoiceUses() }>
        Use another item in my pantry
        </li></ul>
        <br />
        <div className="w3-card w3-content "
             style={ {display: visable[this.state.modalChoiceType] ? 'block': 'none' } }>
             Which item in the pantry?
             {this.renderModalDropdown()}
        <div className="w3-border-left w3-content"
             style={ {display: this.state.modalChoiceType == 'uses' ? 'block': 'none' } }>
             Consume at this rate<br />
             { this.renderModalConversion() }x <br />
             in what measure?<br />
             { this.renderModalMeasures() }
             </div>
        </div>
        <br />
        <div className="w3-button"
             onClick={()=>this.handleModalSave()}>Save</div>
        <div className="w3-button w3-margin-left"
             onClick={()=>this.handleModalUndo()}>Undo</div>
        </>}}

    renderModalwindow(){
        if (this.state.modalVisable) {
        return <>
        <div id="id01"
             style={ this.state.modalVisable ? {display:'block'} : {display:'none'} }
             className="w3-modal">
            <div className="w3-modal-content w3-card w3-container">
                    <span onClick={ ()=>this.handleModalClose() }
                    className="w3-button w3-display-topright">&times;</span>
                    { this.renderModalOptions() }
            </div>
        </div>
        </>}
    }

    componentDidMount(){
        this.myIsMounted = true;
        if (!this.checkCompatVideo()) {
            console.log('This browser only supports uploading pre-saved images.')}}

    componentWillUnmount(){
        this.myIsMounted = false}

    checkCompatVideo(){
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)}

    handleFileUpload(event){
        let files = event.target.files
        for (let i = 0, f; f = files[i]; i++){
            if (!f.type.match('text/.*')){
                alert("Must be a text only file")
                continue}
            let reader = new FileReader();
            // Closure to capture the file information.
            reader.onload = (e) => {
                if (this.myIsMounted) {
                    this.setState({ recipeField: e.target.result })}}
            // Read in the image file as a data URL.
            reader.readAsText(f)}}

    handleImageUpload(files){
        for (let i = 0, f; f = files[i]; i++){
            if (!f.type.match('image/.*')){
                alert("Must be a image file")}
            else {
                let callBack = (xhr) => {
                    //console.log(xhr.responseText);
                    let state = xhr.readyState
                    let status = xhr.status
                    let cat = Math.floor(status/100)
                    if ((state == 4) && status == 200){
                        const recipeText = JSON.parse(xhr.responseText)['text']
                        if (this.myIsMounted) {
                            this.setState({ ocrisLoading: false })}}
                        else if (state == 4 && cat != '2' && cat != '3'){
                            this.setState({ ocrisLoading: false })}}
        let formData = new FormData()
        //console.log(f)
        formData.append('file', f , f.name)
        //console.log(formData.has('file'))
        const settings = {
            url: '/v1/recipes/ocr',
            data: formData,
            isFileUpload: true,
            method: 'POST',
            callBack: callBack,
            history: this.props.history}
        let req = new Request()
        req.props = settings
        req.withAuth()
        if (this.myIsMounted){
            this.setState({ocrisLoading: true})}}}}

    handleRecipeChange(event){
        if (this.myIsMounted){
            this.setState({recipeField: event.target.value})}}

    handleListPress(item){
        this.setState({modalItem: item,
                       modalVisable: true})}

    handleSubmit(event){
        event.preventDefault()
        let callBack = (xhr) => {
            //console.log(xhr.responseText)
            let state = xhr.readyState
            let status = xhr.status
            let cat = Math.floor(status/100)
            if ((state == 4) && status == 200) {
                const {pathname} = this.props.location
                const recipe = JSON.parse(xhr.responseText)['recipe']
                if (this.myIsMounted) {
                    this.setState({ isLoading: false,
                                    newRecipeName: recipe['name'],
                                    isDuplicate: recipe['isDuplicate'],
                                    IngredientList: recipe['ingredients'],
                                    instructions: recipe['instructions'],
                                    allIngs: recipe['allIngs'] })
                    this.refs.name.scrollIntoView()}}
            else if (state == 4 && cat != 2 && cat != 3){
                if (cat == 4){
                    this.setState({ newRecipeName: xhr.responseText,
                                    isLoading: false})
                    console.log( xhr.responseText )}
                else {
                    this.setState({ isLoading: false})
                    console.log( xhr.responseText )}}}
        const settings = {
            url: '/v1/recipes/parse',
            headers: {"content-type": "application/json"},
            data: JSON.stringify({"recipe": this.state.recipeField}),
            method: 'POST',
            callBack: callBack,
            history: this.props.history}
        //console.log(settings)
        let req = new Request()
        req.props = settings
        req.withAuth()
        if (this.myIsMounted) {
            this.setState({ isLoading: true})}}

    handleDelete(event){
        event.preventDefault()
        let callBack = (xhr) => {
        //console.log(xhr.responseText)
        let state = xhr.readyState
        let status = xhr.status
        let cat = Math.floor(status/100)
        if ((state == 4) && status == 200) {
            const recipe = JSON.parse(xhr.responseText)['recipe']
            if (this.myIsMounted) {
                this.setState({ DeleteIsLoading: false,
                                isDeleted: true })}}
        else if (state == 4 && cat != 2 && cat != 3){
            this.setState({ DeleteIsLoading: false})
            console.log( xhr.responseText )}}
        const settings = {
            url: '/v1/recipes/' + this.state.recipeName,
            data: JSON.stringify({"recipe": this.state.recipeField }),
            method: 'DELETE',
            callBack: callBack,
            history: this.props.history,
            headers: {"content-type": "application/json"}}
        let req = new Request()
        req.props = settings
        req.withAuth()
        if (this.myIsMounted) {
            this.setState({DeleteIsLoading: true})}}

    renderOcrButton(){ return (<>
        {this.state.ocrisLoading && (<>
            <label className="w3-bar" htmlFor="OCR" aria-label=" processing image upload">
              <i className="w3-left w3-bar-item w3-button w3-xlarge fa fas fa-print fa-spin">
                 <span className="font-override w3-large"> processing image</span>
              </i></label>
            <input type="file"
                   id="OCR"
                   style={{display: "none"}}
                   name="uploadedfile"
                   accept="image/*"
                   capture /></>)}
        {!this.state.ocrisLoading && (<>
            <label className="w3-bar" htmlFor="OCR" aria-label=" use text recognition on a image">
                <i className="w3-left w3-bar-item w3-button w3-xlarge fas fa-print">
                   <span className="font-override w3-large"> read image</span></i></label>
            <input type="file"
                   id="OCR"
                   style={{display: "none"}}
                   name="uploadedfile"
                   accept="image/*"
                   capture
                   onChange={ (event) => this.handleImageUpload(event.target.files)} /></>)}</>)}

    renderFileUploadButton(){ return (<>
        <label className="w3-bar" htmlFor="upload" aria-label="file upload">
            <i className="w3-left w3-bar-item w3-button w3-xlarge fas fa-file-word">
            <span className="font-override w3-large"> read text file</span></i></label>
        <input type="file"
               style={{display: "none"}}
               id="upload"
               onChange={ (event) => this.handleFileUpload(event)} /></>)}

    renderDeleteButton(){ return (<>
        {this.isAdd && <>
            <div className="w3-bar"
                 aria-label="delete this recipe"
                 onClick={ (event) => this.handleDelete(event)} >
                   <i className="w3-left w3-bar-item w3-button w3-xlarge fas fa-trash-alt">
                      <span className="font-override w3-large"> Delete Recipe</span></i>
            </div>
            {this.state.isDeleted && <Redirect to='/recipes' / >}
        </>}</>)}

    renderFoodDotComUrl(){ return (<>
        <div className="w3-bar"
             aria-label="read url pasted in the textarea"
             onClick={ () => this.renderThisRecipe(this.state.recipeField)}
             alt=" Paste a url into the recipe field then hit this button." >
               <i className="w3-left w3-bar-item w3-button w3-xlarge fa-solid fa-link">
                  <span className="font-override w3-large"> food.com address</span></i>
        </div></>)}

    renderExampleButton(){ return (<>
        <div
          className="w3-bar"
          aria-label="insert example recipe"
          onClick={(event) => this.setState({ recipeField: this.state.example })}
          alt="This button adds example to the Recipe field of the form." >
          <label>
               <i className="w3-left w3-bar-item w3-button w3-xlarge fa-solid fa-link">
                   <span className="font-override w3-large"> Insert Example</span></i>
          </label>
        </div></>)}

    renderThisRecipe(target_url=false){
        //console.log(this.props.location)
        const {pathname} = this.props.location
        //console.log(pathname)
        let recipeName = ''
        let id = '-1'
        let url = ''
        let method = 'GET'
        //console.log(pathname)
        if (pathname.match(/^\/recipes\/edit\/.*/)){
            recipeName = pathname.replace('/recipes/edit/', '')
            url = '/v1/recipes/'+ recipeName }
        else if (pathname.match(/^\/public\/recipes\/.*/)){
            recipeName = pathname.replace(/\/public\/recipes\//, '').replace(/\/.*$/, '')
            // console.log(recipeName)
            id = pathname.replace(/\/public\/recipes\/.*\//, '')
            // console.log(id)
            url = '/v1/public/recipes/' + recipeName + '/' + id}
        else if (target_url){
            url = '/v1/recipes/scrape'
            method = 'POST'
        }

        //console.log(recipeName)
        let callBack = (xhr) => {
            //console.log(xhr.responseText)
            let state = xhr.readyState;
            let status = xhr.status;
            let cat = Math.floor(status/100);
            if ((state == 4) && status == 200) {
                //console.log(JSON.parse(xhr.responseText))
                const recipe = JSON.parse(xhr.responseText)['name']
                let ingredients = JSON.parse(xhr.responseText)['ingredients']
                let dedupDisplay = (x) => {
                  // disable dedup for scraped data
                  if (target_url) { return x } else {
                    // dedup stuff
                    if (x['amountMeasure'] == x['name']){
                        return  x['amount'] +' '+ x['amountMeasure']}
                    else {
                        return x['amount'] + ' ' +
                               x['amountMeasure'] + ' ' +
                               x['name']}}}
                let ingredientsDisplay = ingredients.map( x => dedupDisplay(x) )
                let instructions = JSON.parse(xhr.responseText)['instructions']
                let recipeText = recipe.concat(recipe,
                                              '\n','\n',
                                              'Ingredients','\n',
                                              ingredientsDisplay.join('\n'),
                                              '\n','\n',
                                              'Directions','\n',
                                              instructions)
                if (this.myIsMounted){
                    this.setState({ isLoading: false,
                                    recipeName: recipe,
                                    recipeField: recipeText})}}
            else if (state == 4 && cat != 2 && cat != 3){
                this.setState({ isLoading: false})
                console.log( xhr.responseText )}}
        const settings = {
            url: url,
            method: method,
            headers: {"content-type": "application/json"},
            data: JSON.stringify({"target_url": target_url}),
            callBack: callBack,
            history: this.props.history}
        let req = new Request()
        req.props = settings
        req.withAuth()
        if (this.myIsMounted) {
            this.setState({ isLoading: true})}}

    render() {return( <>
        <Header history={this.props.history}
                inner={(this.props.isEdit ? 'Edit': 'Add') + " Recipe"} />
        <div className="w3-margin">
            <div className={"w3-content w3-row-padding"} >
                {this.state.recipeName ? (
                    <p className="w3-card">
                        <b>{this.state.recipeName}</b></p>)
                : ''}
                <div className="w3-row">
                    <div className="w3-dropdown-hover w3-third w3-margin-bottom">
                        <button className="w3-button w3-bar">
                            <i className="w3-left w3-rest w3-xlarge fas fa-carrot">
                             <span className="font-override"/> Options</i></button>
                        <div className="w3-bar-block w3-dropdown-content">
                            {this.renderFileUploadButton()}
                            {this.renderOcrButton()}
                            {this.renderDeleteButton()}
                            {this.renderFoodDotComUrl()}
                            {this.renderExampleButton()}</div></div></div>
                <form method="POST"
                      className={"w3-card " +
                                 "w3-round-large" +
                                 "w3-form "}
                      onSubmit={(event) => this.handleSubmit(event)} ><b>
                    <label htmlFor="recipeField" className="w3-large">Recipe: </label>
                    <textarea id="recipeField"
                              rows="15"
                              className="w3-input w3-margin-16"
                              onChange={(e) => this.handleRecipeChange(e)}
                            value={this.state.recipeField} ></textarea></b>
                    { this.state.isLoading ? (
                    <label htmlFor="review">
                        <i className="fa fa-cog fa-spin fa-fw fa-3x"></i></label>)
                    : (<input type="submit"
                              id="review"
                              value="Review Recipe"
                              className={"call-to-action w3-button " +
                                         "w3-block "} />)}</form>
                {this.state.newRecipeName ? (
                    <div ref="name"><br />
                    <div className="w3-card w3-xlarge" >{this.state.newRecipeName}</div></div>)
                : ''}
                <br />
                {this.state.newRecipeName ? (
                    <h3> Smart Ingredient Helper</h3>)
                : ''}
                {this.state.newRecipeName ? (
                    <IngredientList items={this.state.IngredientList}
                                    allIngs={this.state.allIngs}
                                    optionCallback={(e)=>this.handleListPress(e)}
                                    ingredientUpdate={(list)=>this.ingredientUpdate(list)}
                                     />):"" }
                {this.renderModalwindow()}
                <div className={"w3-padding"}></div>
                {this.state.newRecipeName ? (
                    <h3>Directions</h3>)
                : ""}
                {this.state.newRecipeName ? (
                    <InstructionsList items={this.state.instructions}
                        instructionsUpdate={(list)=>this.instructionsUpdate(list)}/>)
                :""}
                <div className={"w3-padding"}></div>
                <ActionRecipe {...this.props}
                    name={this.state.recipeName}
                    newName={this.state.newRecipeName}
                    isEdit={this.props.isEdit}
                    ingredients={this.state.IngredientList}
                    instructions={this.state.instructions}/></div></div></>)}}
