import React from 'react';
import { Link, withRouter } from "react-router-dom";
import { Header } from './header.js';
import { Request, LinkDispList, thumbnail } from './utils.js';


export class PantryForm extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      barcodeIsLoading: false,
      ValidateIsLoading: false,
      pictureIsLoading: false,
      DeleteIsLoading: false,
      isLoading: false,
      previousName: '',
      name: '',
      lastBuyDate: '',
      freshFor: 0,
      amount: 0,
      amountPkg: 1,
      byWeight: true,
      barcode: '',
      keepStocked: false,
      requiredBy: [],
      imagePath: '',
      warnNameChange: false
    };
    this.myIsMounted= false;
    // These are just handlers being registered with the running process.
    this.gotIt = this.gotIt.bind(this);
    this.setDate = this.setDate.bind(this);
    this.toggleByWeight = this.toggleByWeight.bind(this);
    this.toggleKeepStocked = this.toggleKeepStocked.bind(this);
    this.deletePicture = this.deletePicture.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleamountPkgChange = this.handleamountPkgChange.bind(this);
    this.handleBarcodeRemove = this.handleBarcodeRemove.bind(this);
    this.handleBarcodeUpload = this.handleBarcodeUpload.bind(this);
  }

  toggleByWeight(e){
    e.preventDefault();

    const newVal = !this.state.byWeight
    this.setState({
      byWeight: newVal
    })
  }

  handleNameChange(event){
    if (this.state.warnNameChange == false){
      alert("By clicking save you will change the name of this item in all related recipies!")
      this.setState({warnNameChange: true})
    }
    this.setState({ name: event.target.value });
  }

  handleAmountChange(event){
    let value = event.target.value
    if (value < 0){
      value = value * -1
    }
    this.setState({ amount: value });
  }

  handleamountPkgChange(event){
    let value = event.target.value
    if (value < 0){
      value = value * -1
    }
    this.setState({ amountPkg: value });
  }

  toggleKeepStocked(e){
    e.preventDefault();
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        if (this.myIsMounted) {
          this.setState({ keepStocked: !this.state.keepStocked });
        }
      } else if (state == 4 && cat != '2' && cat != '3') {
        console.log(xhr.responseText);
      }
    };
    const settings = {
      url: '/v1/inventory/' + encodeURIComponent(this.state.name),
      data: JSON.stringify({ keepStocked: !this.state.keepStocked }),
      method: 'PUT',
      callBack: callBack,
      history: this.props.history,
      headers: {"content-type": "application/json"}
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
  }

  componentDidMount() {
    this.myIsMounted = true;
    if (!this.checkCompatVideo()) {
      console.log('This browser only supports uploading pre-saved images.');
    }
    if (this.props.isEdit) {
        this.renderThisRecipe();
    }
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
      url: '/v1/inventory/image/' + encodeURIComponent(this.state.name),
      data: '{}',
      isFileUpload: true,
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

  handleBarcodeRemove(){
   //console.log("activated")
   let callBack = (xhr) => {
     //console.log(xhr.responseText);
     let state = xhr.readyState;
     let status = xhr.status;
     let cat = Math.floor(status/100);
     if ((state == 4) && status == 200) {
       //console.log("finished OKAY")
       const text = JSON.parse(xhr.responseText)['text'];

       if (this.myIsMounted) {
         this.setState({ barcodeIsLoading: false,
                         barcode: false });
       }
     } else if (state == 4 && cat != '2' && cat != '3') {
       console.log(xhr.responseText)
       this.setState({ barcodeIsLoading: false });
     }
   };
   const settings = {
     url: '/v1/inventory/barcode/' + encodeURIComponent(this.state.name),
     data: '{}',
     method: 'DELETE',
     callBack: callBack,
     history: this.props.history
   };
   let req = new Request();
   req.props = settings;
   req.withAuth();
   if (this.myIsMounted) {
     this.setState({barcodeIsLoading: true});
   }
 }

  handleBarcodeUpload(files){
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
            const text = JSON.parse(xhr.responseText)['text'];

            if (this.myIsMounted) {
              this.setState({ barcodeIsLoading: false,
                              barcode: text });
            }
          } else if (state == 4 && cat != '2' && cat != '3') {
            alert(xhr.responseText)
            this.setState({ barcodeIsLoading: false });
          }
        };

        let formData = new FormData();
        //console.log(f);
        formData.append('file', f , f.name );
        //console.log(formData.has('file'))
        const settings = {
          url: '/v1/inventory/barcode/' + encodeURIComponent(this.state.name),
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
          this.setState({barcodeIsLoading: true});
        }
      }
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
            alert(xhr.responseText)
            this.setState({ pictureIsLoading: false });
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
                url: '/v1/inventory/image/' + encodeURIComponent(this.state.name),
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


  checkCompatVideo(){
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  handleSubmit(event){
    event.preventDefault();
    let callBack = (xhr) => {
      console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        console.log("state 4 , status 200")
        const recipe = JSON.parse(xhr.responseText)['recipe'];
        if (this.myIsMounted) {
          console.log("isMounted true")
          this.setState({ isLoading: false });
          if (this.props.isEdit){
              console.log("isEdit true")
              this.props.history.goBack();
          }else{
              console.log("isEdit false")
              this.props.history.push('/pantry/');}}
      }else if (state == 4 && cat != 2 && cat != 3) {
        console.log("state 4, cat not 2 or 3")
        if (status == 409){
          alert("duplicate entry")}
        this.setState({ IsLoading: false})
        console.log( xhr.responseText )}};
    const userKeyRegExp = /^[a-zA-Z]{3}\ [0-9]{2}\ [0-9]{4}$/;
    const valid = userKeyRegExp.test(this.state.lastBuyDate);
    if (! valid && ! this.state.lastBuyDate == '') {
      alert("Item bought must be formated like 'Mon Jan 01 2020'")
      return}
    let settings = {}
    if (this.props.isEdit) {
      settings = {
        url: '/v1/inventory/' + encodeURIComponent(this.state.previousName),
        data: JSON.stringify({"name": this.state.name,
                              "amount": this.state.amount,
                              "amountPkg": this.state.amountPkg,
                              "keepStocked": this.state.keepStocked,
                              "lastBuyDate": this.state.lastBuyDate,
                              "freshFor": this.state.freshFor,
                              "barcode": this.state.barcode }),
        method: 'PUT',
        callBack: callBack,
        history: this.props.history,
        headers: {"content-type": "application/json"}};
    }else{
      settings = {
        url: '/v1/inventory/' + encodeURIComponent(this.state.name),
        data: JSON.stringify({"name": this.state.name,
                              "amount": this.state.amount,
                              "amountPkg": this.state.amountPkg,
                              "keepStocked": this.state.keepStocked,
                              "lastBuyDate": this.state.lastBuyDate,
                              "byWeight": this.state.byWeight,
                              "freshFor": this.state.freshFor,
                              "barcode": this.state.barcode }),
        method: 'POST',
        callBack: callBack,
        history: this.props.history,
        headers: {"content-type": "application/json"}};}
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ IsLoading: true})}
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
          this.setState({ DeleteIsLoading: false });
          this.props.history.goBack();
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ DeleteIsLoading: false});
        alert( xhr.responseText );
      }};
    const settings = {
      url: '/v1/inventory/' + encodeURIComponent(this.state.name),
      data: '{}',
      method: 'DELETE',
      callBack: callBack,
      history: this.props.history,
      headers: {"content-type": "application/json"}
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({DeleteIsLoading: true});
    };
  }

  renderThisRecipe(){
    // console.log(this.props.location);
    const {pathname} = this.props.location;
    // console.log(pathname);
    const name = pathname.replace('/pantry/edit/', '')
    // console.log(name);
    let callBack = (xhr) => {
      // console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        // console.log(xhr.responseText)
        const json = JSON.parse(xhr.responseText)
        if (this.myIsMounted) {
          this.setState({ ValidateIsLoading: false,
                          imagePath: json['imagePath'],
                          name: json['name'],
                          previousName: json['name'],
                          amount: json['amount'],
                          amountPkg: json['amountPkg'],
                          lastBuyDate: json['lastBuyDate'] ? json['lastBuyDate'] : '',
                          freshFor: json['freshFor'],
                          barcode: json['barcode'],
                          byWeight: json['byWeight'],
                          requiredBy: json['requiredBy'],
                          keepStocked: json['keepStocked']});
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ ValidateIsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/inventory/' + encodeURIComponent(name),
      method: 'GET',
      callBack: callBack,
      history: this.props.history
    };
    let req = new Request();
    req.props = settings;
    // console.log("making request")
    // console.log(req)
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ValidateIsLoading: true});
    };
  }

  setDate(e) {
    e.preventDefault();
    let date = new Date();
    const ddate = date.toDateString().slice(4)
    this.setState({ lastBuyDate: ddate })
  }

  handleLastBuyDate(e){
    e.preventDefault();
    const buyDate = e.target.value
    this.setState({ lastBuyDate: buyDate })
  }

  gotIt(e) {
    e.preventDefault();
    //this is a bitwise integer conversion techniqe
    if (this.state.amountPkg != 0){
      const newAmount = (~~this.state.amount) + (~~this.state.amountPkg);
      this.setState({ amount: newAmount});
    } else {
      alert("Please set the amount in a package for this item in oz. or count.")
    }
  }

  freshFor(num){
    //this part ensures that clicking something already clicked
    //causes that selection to be removed.
    let num2 = 0;
    if ( num != this.state.freshFor ){
      num2 = num
    }
    const num3 = num2
    this.setState({
      freshFor: num2,
    })
  }

  render() {
    return(
      <>
        <Header history={ this.props.history } inner={ (this.props.isEdit ? 'Edit': 'Add')+" pantry" } />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-content"} >
            <div className="w3-row">
              <div className="w3-dropdown-hover w3-third w3-margin-bottom">
                <button className="w3-button w3-bar">
                  <i className="w3-left w3-xlarge fas fa-carrot"> Options</i>
                </button>
                <div className="w3-bar-block w3-dropdown-content">
                  <label className="w3-bar" htmlFor="picture" aria-label="take a picture">
                    <i className={"w3-left w3-bar-item w3-button w3-xlarge fas fa-camera w3-hover-yellow " +
                                    (this.state.pictureIsLoading ? "fa-spin" : "") }
                                    aria-hidden="true" > Upload Picture</i>
                  </label>
                  <input type="file"
                         id="picture"
                         style={{display: "none"}}
                         name="uploadPicture"
                         accept="image/*"
                         capture
                         onChange={ this.state.pictureIsLoading ? undefined :
                                    (event) => this.handlePictureUpload(event.target.files) } />
                  { !this.state.barcode ?
                    (<>
                      <label className="w3-bar" htmlFor="barcode" aria-label="scan in barcode id">
                        <i className={"w3-left w3-bar-item w3-button w3-xlarge w3-hover-yellow fas fa-barcode " +
                                      (this.state.barcodeIsLoading ? "fa-spin" : "") }
                                      aria-hidden="true"> Add Barcode</i>
                      </label>
                      <input type="file"
                           id="barcode"
                           style={{display: "none"}}
                           name="uploadBarcode"
                           accept="image/*"
                           capture
                           onChange={(event)=>this.handleBarcodeUpload(event.target.files)}/></>)
                    :(<>
                        <label className="w3-bar" htmlFor="delBarcode" aria-label="Remove barcode id">
                            <i className={"w3-left w3-xlarge w3-hover-yellow w3-bar-item w3-button fas fa-barcode " +
                                  (this.state.barcodeIsLoading ? "fa-spin" : "") }
                                aria-hidden="true">
                                { !this.state.barcodeIsLoading ?
                                    " Remove Barcode" : "" }</i></label>
                        <button id="delBarcode"
                                style={{display: "none"}}
                                onClick={() => this.handleBarcodeRemove() } /></>)}

                  <label className="w3-bar" htmlFor="stock" aria-label="keep stocked">
                    <i className={"w3-left w3-bar-item w3-button w3-xlarge w3-hover-yellow fas fa-cart-arrow-down " +
                                  (this.state.keepStocked ? "w3-yellow" : "") }
                       aria-hidden="true"> Keep Stocked</i>
                  </label>
                  <button style={{display: "none"}}
                       id="stock"
                       onClick={ e => this.toggleKeepStocked(e) }
                       />
                  <label className="w3-bar" htmlFor="delete" aria-label="delete this recipe">
                    <i className="w3-left w3-bar-item w3-button w3-xlarge w3-hover-yellow fas fa-trash-alt" aria-hidden="true"> Delete</i>
                  </label>
                  <button style={{display: "none"}}
                       id="delete"
                       onClick={ (event) => this.handleDelete(event) } />
                </div>
              </div>
            </div>
            <form method="POST"
                  className="w3-card w3-container"
                  onSubmit={ (event) => this.handleSubmit(event) } >

                <div className="w3-display-container" >
                    { thumbnail(this.state) }
                    { this.state.imagePath ? (
                          <button className={"fas fa-trash-alt w3-xlarge " +
                                             "w3-display-bottomright w3-display-hover w3-margin " +
                                             "w3-btn w3-opacity w3-orange"}
                                  onClick={ (event) => this.deletePicture(event) }/>) : ""}</div>

                <h2 className="" >Name:</h2>
                <p><b>
                  <input className=""
                    type="text"
                    placeholder="Name"
                    onChange={ this.handleNameChange }
                    value={this.state.name} /></b></p>

                <p>
                  <button className="w3-button w3-hover-yellow"
                          onClick={e => this.toggleByWeight(e) }>Measure by: {
                            this.state.byWeight ? (<b>oz</b>) : "oz, " }{
                            this.state.byWeight ? ", piece" : (<b>piece</b>)}</button></p>
                <label className="w3-left" >Amount in Package { this.state.byWeight ? "(oz)" : "" }</label>
                <br />
                  <b>
                  <input className=""
                       type="number"
                       size="5"
                       onChange={ this.handleamountPkgChange }
                       value={ this.state.amountPkg } /></b>
                { this.state.barcode ? (<p><label className="w3-left">Barcode</label>
                                        <b>
                                         <input className="w3-input w3-center"
                                                type="text"
                                                readOnly
                                                value={ this.state.barcode } />
                                        </b></p>) : "" }
                <p>
                  <label className="w3-left"
                       htmlFor="gotIt"
                       aria-label="Add Package to Amount">
                    <i className="w3-left w3-bar w3-button w3-hover-yellow"
                       aria-hidden="true" > Add a Package to pantry</i></label>
                  <button style={{display: "none"}}
                          id="gotIt"
                          onClick={ e => this.gotIt(e) }></button>
                  </p>
                  <br /><br />
                <label className="w3-left" >Amount { this.state.byWeight ? "(oz)" : "" }</label>
                <br />
                <b>
                  <input className=""
                         type="number"
                         size="5"
                         step='any'
                         onChange={ this.handleAmountChange }
                         value={ this.state.amount } /></b>
                  <br /> <br />


              <div className="w3-margin-top w3-border-top w3-border-black">
                <h2>Expiration:</h2>
                <p>
                  <label className="w3-bar"
                         htmlFor="setDate"
                         aria-label="Set today as buy date">
                    <i className="w3-left w3-button"
                       aria-hidden="true" > Set today as buy date</i></label>
                  <button style={{display: "none"}}
                          id="setDate"
                          onClick={ e => this.setDate(e) }></button></p>
                <p>
                  <label className="w3-left" >Item bought</label>
                  <b><br />
                    <input className=""
                           type="text"
                           onChange={ e => this.handleLastBuyDate(e) }
                           value={ this.state.lastBuyDate  } /></b></p>
                <label className="w3-left" >Fresh for</label>
                  <div className="w3-bar" >
                    <span key="7" className={"w3-bar-item w3-button " +
                                              (this.state.freshFor == 7 ? 'w3-yellow' : '')}
                                  onClick={() => this.freshFor(7) }>
                                  1 wk.</span>
                    <span key="14" className={"w3-bar-item w3-button " +
                                              (this.state.freshFor == 14 ? 'w3-yellow' : '')}
                                  onClick={() => this.freshFor(14) }>
                                  2 wk.</span>
                    <span key="30" className={"w3-bar-item w3-button " +
                                              (this.state.freshFor == 30 ? 'w3-yellow' : '')}
                                  onClick={() => this.freshFor(30) }>
                                  1 mo.</span>
                    <span key="90" className={"w3-bar-item w3-button " +
                                              (this.state.freshFor == 90 ? 'w3-yellow' : '')}
                                  onClick={() => this.freshFor(90) }>
                                  3 mo.</span>
                    <span key="180" className={"w3-bar-item w3-button " +
                                              (this.state.freshFor == 180 ? 'w3-yellow' : '')}
                                  onClick={() => this.freshFor(180) }>
                                  6 mo.</span>
                    <span key="354" className={"w3-bar-item w3-button " +
                                              (this.state.freshFor == 354 ? 'w3-yellow' : '')}
                                  onClick={() => this.freshFor(354) }>
                                  1 yr.</span></div></div>
              <p>
                <input className="call-to-action w3-button"
                       type="submit"
                       value={ !this.state.isLoading ? "Save" : (<i className="fa fa-cog fa-spin fa-fw fa-3x"></i>) } /></p>
            </form>
            { this.state.requiredBy.length ? (<h2>Required by</h2>) : "" }
            <LinkDispList
                path={ '/recipes/view' }
                items={ this.state.requiredBy } / >
          </div>
        </div>
      </>
    )
  }
}

// removed as hints are now working and this may not be needed.
