import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';


export class RecipesAdd extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isFalied: false,
      isPaste: false,
      isUpload: false,
      isCopy: false,
      recipeField: '',
      addLink: true
    };
    this.myIsMounted= false;
    // These are just handlers being registered with the running process.
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.handleImageUpload = this.handleImageUpload.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleLink = this.toggleLink.bind(this);
  }

  componentDidMount() {
    this.myIsMounted = true;
    if (this.check_compat_video()) {
      // Good to go!
    } else {
      alert('video capture is not supported by your browser');
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

  handleImageUpload(event){
    let files = event.target.files;
    for (let i = 0, f; f = files[i]; i++) {
      if (!f.type.match('image/.*')) {
        alert("Must be a image file");
      }
      // step 1 mamke a request to ocr or server

      //step 2 load resulting data into recipeField
      if (this.myIsMounted) {
          this.setState({ recipeField: e.target.result });
        }
      // Read in the image file as a data URL.
      reader.readAsText(f);
    }
  }

  handleRecipeChange(event){
    if (this.myIsMounted){
      this.setState({ recipeField: event.target.value })
    }
  }

  handleSubmit(){
    event.preventDefault();
  }

  toggleLink(){
    this.setState({ addLink: !this.state.addLink })
  }

  check_compat_video(){
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  render() {
    return(
      <>
        <Header inner="Add Recipe" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-center " +
                          "w3-content " +
                          "w3-mobile "} >
            <form method="POST"
                  className={"w3-card " +
                             "w3-form "}
                  onSubmit={() => this.handleSubmit()} >
              <div className="w3-bar w3-center w3-padding w3-xlarge">
                <label htmlFor="OCR" aria-label="use picture">
                  <i className="w3-btn w3-hover-yellow fas fa-camera" aria-hidden="true"></i>
                </label>
                <input type="file"
                       id="OCR"
                       style={{display: "none"}}
                       name="uploadedfile"
                       accept="image/*"
                       capture
                       onChange={ (event) => this.handleFileChange(event)}
                       />
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
                <Link name="help" className="w3-bar-item w3-right w3-btn w3-hover-yellow" to='/help/pantry/add' >
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
              <textarea rows="15"
                        className="w3-input w3-margin-16"
                        onChange={(e) => this.handleRecipeChange(e) }
                        placeholder="Paste Recipe here. You can also use the buttons above to import from a picture,web link, or plain text file.
If you have problems with the application reading your recipe follow these rules.
1. The first line is the title always.
2. Somewhere after that use the heading 'ingredients' followed by a list of ingredients one per line.
3. Somewhere after that use the heading 'make it' or 'directions' or 'instructions' followed by instructions, one per line."
                        value={ this.state.recipeField } ></textarea>
              <input  type="submit"
                      value={ !this.props.isLoading ? "Validate" : (<i className="fa fa-cog fa-spin fa-fw fa-3x"></i>) }
                      className="w3-btn w3-block w3-hover-yellow" />
            </form>
          </div>
        </div>
      </>
    )
  }
}
