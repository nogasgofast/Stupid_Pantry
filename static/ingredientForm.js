import React from 'react';
import { Link, withRouter } from "react-router-dom";
import { Header } from './header.js';
import { Request, GroupActionList, thumbnail } from './utils.js';


export class IngredientForm extends React.Component {
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
      amount: 0,
      amountPkg: 1,
      isMeasured: false,
      barcode: '',
      keepStocked: false,
      requiredBy: [],
      imagePath: ''
    };
    this.myIsMounted= false;
    // These are just handlers being registered with the running process.
    this.gotIt = this.gotIt.bind(this);
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

  handleNameChange(event){
    this.setState({ name: event.target.value });
  }

  handleAmountChange(event){
      this.setState({ amount: event.target.value });
  }

  handleamountPkgChange(event){
      this.setState({ amountPkg: event.target.value });
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
      url: '/v1/inventory/' + this.state.name,
      data: JSON.stringify({ keepStocked: !this.state.keepStocked }),
      method: 'PUT',
      callBack: callBack,
      headers: {"content-type": "application/json"},
      ...this.props
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
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
      url: '/v1/inventory/image/' + this.state.name,
      data: '{}',
      isFileUpload: true,
      method: 'DELETE',
      callBack: callBack,
      ...this.props
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({pictureIsLoading: true});
    }
  }

 handleBarcodeRemove(){
   console.log("activated")
   let callBack = (xhr) => {
     //console.log(xhr.responseText);
     let state = xhr.readyState;
     let status = xhr.status;
     let cat = Math.floor(status/100);
     if ((state == 4) && status == 200) {
       console.log("finished OKAY")
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
     url: '/v1/inventory/barcode/' + this.state.name,
     data: '{}',
     method: 'DELETE',
     callBack: callBack,
     ...this.props
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
            console.log(xhr.responseText)
            this.setState({ barcodeIsLoading: false });
          }
        };

        let formData = new FormData();
        //console.log(f);
        formData.append('file', f , f.name );
        //console.log(formData.has('file'))
        const settings = {
          url: '/v1/inventory/barcode/' + this.state.name,
          data: formData,
          isFileUpload: true,
          method: 'POST',
          callBack: callBack,
          ...this.props
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
                url: '/v1/inventory/image/' + this.state.name,
                data: formData,
                isFileUpload: true,
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
          this.setState({ isLoading: false });
          this.props.history.goBack();
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ IsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/inventory/' + this.state.previousName,
      data: JSON.stringify({"name": this.state.name,
                            "amount": this.state.amount,
                            "amountPkg": this.state.amountPkg,
                            "keepStocked": this.state.keepStocked,
                            "barcode": this.state.barcode }),
      method: 'PUT',
      callBack: callBack,
      headers: {"content-type": "application/json"},
      ...this.props};
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ IsLoading: true});
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
          this.setState({ DeleteIsLoading: false });
          this.props.history.goBack();
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ DeleteIsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/inventory/' + this.state.name,
      data: '{}',
      method: 'DELETE',
      callBack: callBack,
      headers: {"content-type": "application/json"},
      ...this.props};
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
    const name = pathname.replace('/pantry/', '')
    //console.log(recipeName);
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        //console.log(JSON.parse(xhr.responseText))
        const json = JSON.parse(xhr.responseText)
        if (this.myIsMounted) {
          this.setState({ ValidateIsLoading: false,
                          imagePath: json['imagePath'],
                          name: json['name'],
                          previousName: json['name'],
                          amount: json['amount'],
                          amountPkg: json['amountPkg'],
                          barcode: json['barcode'],
                          isMeasured: json['isMeasured'],
                          requiredBy: json['requiredBy'],
                          keepStocked: json['keepStocked']});
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ ValidateIsLoading: false});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/inventory/' + name,
      method: 'GET',
      callBack: callBack,
      ...this.props
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({ValidateIsLoading: true});
    };
  }

  gotIt(e) {
    e.preventDefault();
    //this is a bitwise integer conversion techniqe
    const newAmount = (~~this.state.amount) + (~~this.state.amountPkg);
    this.setState({ amount: newAmount });
  }

  render() {
    return(
      <>
        <Header history={ this.props.history } inner={ (this.props.isEdit ? 'Edit': 'Add')+" pantry" }
                isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-content "} >
            <div className="w3-bar w3-card w3-xlarge w3-margin-bottom">
              <label className="w3-tooltip" htmlFor="picture" aria-label="take a picture">
                <i className={"fas fa-camera  w3-btn w3-hover-yellow " +
                                (this.state.pictureIsLoading ? "fa-spin" : "") }
                                aria-hidden="true" >
                </i>
                <span className="w3-text">Upload Picture</span>
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
                  <label className="w3-tooltip" htmlFor="barcode" aria-label="scan in barcode id">
                    <i className={"w3-btn w3-hover-yellow fas fa-barcode " +
                                  (this.state.barcodeIsLoading ? "fa-spin" : "") }
                                  aria-hidden="true"></i>
                    <span className="w3-text">Add Barcode</span>
                  </label>
                  <input type="file"
                       id="barcode"
                       style={{display: "none"}}
                       name="uploadBarcode"
                       accept="image/*"
                       capture
                       onChange={ (event) => this.handleBarcodeUpload(event.target.files) } />
                  </>):
                (<label className="w3-tooltip"
                         aria-label="scan in barcode id">
                  <button className="w3-btn w3-hover-yellow w3-display-container"
                          onClick={() => this.handleBarcodeRemove() }>
                      <i className={"fas fa-barcode " +
                                  (this.state.barcodeIsLoading ? "fa-spin" : "") }
                         aria-hidden="true"></i>
                      <i className={"w3-display-middle fas fa-slash " +
                                  (this.state.barcodeIsLoading ? "fa-spin" : "") }
                         aria-hidden="true"></i>
                  </button>
                  <span className="w3-text">Remove Barcode</span>
                </label>) }
              <label className="w3-tooltip" htmlFor="stock" aria-label="keep stocked">
                <i className={"w3-btn w3-hover-yellow fas fa-cart-arrow-down " +
                              (this.state.keepStocked ? "w3-yellow" : "") }
                   aria-hidden="true"></i>
                <span className="w3-text">Keep Stocked</span>
              </label>
              <button style={{display: "none"}}
                   id="stock"
                   onClick={ e => this.toggleKeepStocked(e) }
                   />
              <label className="w3-tooltip"
                     htmlFor="gotIt"
                     aria-label="Add package to pantry">
                <i className="w3-btn w3-hover-yellow w3-xlarge fas fa-plus"
                   aria-hidden="true" ></i>
                <span className="w3-text">Add package to pantry</span>
              </label>
                <button style={{display: "none"}}
                        id="gotIt"
                        onClick={ e => this.gotIt(e) }>
                </button>
              <label className="w3-tooltip" htmlFor="delete" aria-label="delete this recipe">
                <i className="w3-btn w3-hover-yellow fas fa-trash-alt" aria-hidden="true"></i>
                <span className="w3-text">Delete if not Required by a Recipe</span>
              </label>
              <button style={{display: "none"}}
                   id="delete"
                   onClick={ (event) => this.handleDelete(event) } />
            </div>
            <form method="POST"
                  className="w3-card"
                  onSubmit={ (event) => this.handleSubmit(event) } >

              <div className="w3-display-container" >
              { thumbnail(this.state) }
              { this.state.imagePath ? (
                    <button className={"fas fa-trash-alt w3-xlarge " +
                                       "w3-display-bottomright w3-display-hover w3-margin " +
                                       "w3-btn w3-opacity w3-orange"}
                            onClick={ (event) => this.deletePicture(event) }/>) : ""}

              </div>
              <div className="w3-container">
              <p>
              <label className="w3-left" >Name</label><b>
              <input className="w3-input w3-center"
                     type="text"
                     placeholder="Name"
                     onChange={ this.handleNameChange }
                     value={this.state.name} /></b></p>
              <label className="w3-left" >Amount { this.state.isMeasured ? "(oz)" : "" }</label>
              <b>
              <input className="w3-center w3-input"
                     type="number"
                     step='any'
                     onChange={ this.handleAmountChange }
                     value={ this.state.amount } />
              </b>
              <p>
              <label className="w3-left" >Amount in Package { this.state.isMeasured ? "(oz)" : "" }</label><b>
              <input className="w3-input w3-center"
                     type="number"
                     onChange={ this.handleamountPkgChange }
                     value={ this.state.amountPkg } /></b></p>
              { this.state.barcode ? (<p><label className="w3-left">Barcode</label>
                                        <b>
                                         <input className="w3-input w3-center"
                                                type="text"
                                                readOnly
                                                value={ this.state.barcode } />
                                        </b></p>) : "" }
              <input className="w3-input w3-orange w3-btn w3-block w3-hover-yellow"
                     type="submit"
                     value={ !this.props.isLoading ? "Save" : (<i className="fa fa-cog fa-spin fa-fw fa-3x"></i>) } />
              </div>
            </form>
            { this.state.requiredBy.length ? (<h2>Required by</h2>) : "" }
            <GroupActionList path={ '/recipes/view' } items={ this.state.requiredBy } / >
          </div>
        </div>
      </>
    )
  }
}
