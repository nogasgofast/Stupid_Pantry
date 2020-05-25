import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { Request, LinkDispList } from './utils.js';


export class ShoppingList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      recipes: [],
      ingredients: [],
      barcodeIsLoading: false,
      isLoading: false
    }
    this.myIsMounted = false
    this.scanBarcode = this.scanBarcode.bind(this)
  }

  componentDidMount() {
    this.myIsMounted = true
    this.renderRecipes()
  }

  componentWillUnmount() {
    this.myIsMounted = false
  }

  scanBarcode(files){
    for (let i = 0, f; f = files[i]; i++) {
      if (!f.type.match('image/.*')) {
        alert("Must be a image file")
      }else{
        let callBack = (xhr) => {
          //console.log(xhr.responseText);
          let state = xhr.readyState
          let status = xhr.status
          let cat = Math.floor(status/100)
          if ((state == 4) && status == 200) {
            const ingredient = JSON.parse(xhr.responseText)['response']
            if (this.myIsMounted) {
              this.props.history.push('/pantry/' + ingredient.name )
              this.setState({ barcodeIsLoading: false})}
          } else if (state == 4 && cat != '2' && cat != '3') {
            alert(xhr.responseText)
            this.setState({ barcodeIsLoading: false })
          }
        }

        let formData = new FormData()
        //console.log(f);
        formData.append('file', f, f.name )
        formData.append('check', f, f.name)
        //console.log(formData.has('file'))
        const settings = {
          url: '/v1/inventory/barcode',
          data: formData,
          isFileUpload: true,
          method: 'POST',
          callBack: callBack,
          history: this.props.history
        }
        let req = new Request()
        req.props = settings
        req.withAuth()
        if (this.myIsMounted) {
          this.setState({barcodeIsLoading: true})
        }
      }
    }
  }

  renderRecipes(){
    let callBack = (xhr) => {
        //console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        //console.log(json)
        if(this.myIsMounted) {
          this.setState({
            recipes: json.recipes,
            ingredients: json.ingredients,
            isLoading: false
          })
        }
      } else if (xhr.readyState == 4){
        this.setState({ isLoading: false })
        console.log( "Short Status " + xhr.status)
      }
    };

    const settings = {
      url: '/v1/views/shopping',
      data: '{}',
      method: 'GET',
      callBack: callBack,
      history: this.props.history
    }
    this.setState({isLoading: true})
    let req = new Request(settings)
    req.withAuth()
  }

  render() {return(<>
    <Header history={ this.props.history } inner="Shopping" />
      <div className="w3-margin w3-row-padding">
        <div className="w3-content">
            <Link to="/recipes">
                <div className="w3-xlarge w3-hover-yellow w3-button w3-block w3-card" >Recipe List</div>
            </Link>
            { !this.state.barcode ? (<>
                <label className="w3-xlarge w3-hover-yellow w3-button w3-block w3-card"
                       htmlFor="barcode" aria-label="scan in barcode id">
                    <i className={"fas fa-barcode " +
                                (this.state.barcodeIsLoading ? "fa-spin" : "") }
                                aria-hidden="true"> Scan Barcode</i></label>
                <input type="file"
                     id="barcode"
                     style={{display: "none"}}
                     name="uploadBarcode"
                     accept="image/*"
                     capture
                     onChange={ (event) => this.scanBarcode(event.target.files) } /></>)
            :(
                <label  className="w3-xlarge w3-orange w3-hover-yellow w3-btn w3-block w3-card"
                        aria-label="scan in barcode id">
                    <i  className={"fas fa-barcode " +
                                (this.state.barcodeIsLoading ? "fa-spin" : "") }
                        aria-hidden="true"></i></label>) }

            { this.state.recipes.length > 0 || this.state.ingredients.length > 0 ? (<>
                <p>Recipies</p>
                <LinkDispList path='/recipes/view'  items={ this.state.recipes } />
                <p>Pantry Items</p>
                <LinkDispList path='/pantry'  items={ this.state.ingredients } /></>)
            :(
                <p className="w3-card w3-content w3-xlarge">
                This list is filled as you run out of supplies for recipes
                marked <b>keep stocked</b>. <i className="fas fa-cart-plus" />
                <br />
                <br />
                You can mark individual ingredients to be kept stocked. It will
                show up here when that item is less then 25% full.</p>)}</div></div></>)}}
