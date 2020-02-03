import React from 'react';
import { Link, Redirect } from "react-router-dom";

export class Request extends React.Component {
  withAuth() {
    let r1 = new XMLHttpRequest();
    r1.open(this.props.method, this.props.url, true);
    for (const key in this.props.headers){
      if (this.props.headers.hasOwnProperty(key)){
        r1.setRequestHeader(key, this.props.headers[key])
      }
    }
    r1.setRequestHeader("Accept", "application/json");
    r1.setRequestHeader("Authorization", "Bearer " + this.props.accessToken);
    r1.onreadystatechange = () => this.wrapCallBack(r1);

    r1.send(this.props.data);
    //no need for a return because the callBack takes care of what needs doing.
    //so we are done now.
  }

  wrapCallBack(xhr){
    /*This function intercepts 401 responses before they get to
     the origional callback and makes a second request to auth.
     this is specificly because the auth time for an access token
     is only 5 minutes*/
    if (xhr.readyState == 4 && xhr.status == 401) {
      console.log("reAuthing");
      //reAuth and resubmit;
      const url = '/v1/auth/refresh';
      let r2 = new XMLHttpRequest();
      r2.open('POST', url, true);
      r2.setRequestHeader("Content-Type", "application/json");
      r2.setRequestHeader("Accept", "application/json");
      //console.log("Bearer " + this.props.refreshToken);
      r2.setRequestHeader("Authorization", "Bearer " + this.props.refreshToken);
      r2.onreadystatechange = () => this.refreshResend(r2);
      r2.send();
    } else {
      this.props.callBack(xhr);
    }
  }

  refreshResend(xhr){
    /* as it's name suggests this function interprets the
    re-auth proceedure and upon working makes a 3rd request.
    The third request is just re-attempting the first with
    no re-auth proceedure failure sets the applicaiton to
    not logged in*/
    console.log("activated refresh resend!!!")
    if (xhr.readyState == 4 && xhr.status == 200) {
      //console.log(xhr.readyState + " " + xhr.status);
      //YeY! requth worked,
      //refresh
      const json = JSON.parse(xhr.responseText);
      this.props.updateAccessToken(json.access_token);
      //resend
      let r3 = new XMLHttpRequest();
      r3.open(this.props.method, this.props.url, true);
      for (const key in this.props.headers){
        if (this.props.headers.hasOwnProperty(key)){
          r3.setRequestHeader(key, this.props.headers[key])
        }
      }
      r3.setRequestHeader("Accept", "application/json");
      r3.setRequestHeader("Authorization", "Bearer " + json.access_token);
      r3.onreadystatechange = () => this.props.callBack(r3);
      r3.send(this.props.data);
    }else if (xhr.readyState == 4 && xhr.status == 401){
      //Boo, no more auth!!!
      this.props.setNotLoggedIn();
    }
  }
}

export class W3Color{
  random(){
    const colors = ["red", "pink", "purple", "deep-purple", "indigo",
                    "blue", "light-blue", "cyan", "aqua", "teal", "green",
                    "light-green", "lime", "sand", "khaki", "yellow", "amber",
                    "orange", "deep-orange", "blue gray", "brown", "light-gray",
                    "gray", "dark-gray", "pale-red", "pale-yellow", "pale-green",
                    "pale-blue"];
    return "w3-" + colors[Math.floor(Math.random()*colors.length)] ;
  }
}

export function thumbnail(item) {
  return  (item.imagePath ? (
            <img className="cover"
              src={ item.imagePath }
              height="300px"
              width="100%"  />) :
            "" )
}

export class GroupActionItem {
  constructor(name, is_matching) {
    //for now all this does is prototype this item. Making
    //sure the programer set all the correct attributes.
    this.name = name;
    this.is_matching = is_matching;
  }
}

export class GroupActionList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      buttons: new Set(),
      selectedItems: new Set(),
      scroll: 50,
      ticking: false,
      path: this.props.path
    };
  }

  render_item(item){
    let viewAmount = 0
    let color = 'w3-green'
    item.viewAmount > 1 ? viewAmount = 1 : viewAmount = item.viewAmount
    if ( viewAmount <= 0.5 ){
      color = 'w3-yellow'
    }
    if ( viewAmount <= 0.25){
      color = 'w3-red'
    }
    return <Link key={ item.name } to={ this.state.path + '/' + item.name } >
              { thumbnail(item) }
              <li className={"w3-card w3-left-align " +
                 (this.state.selectedItems.has(item.name) ?
                 "w3-border-yellow w3-rightbar" :
                 "")}>
                  { item.name }
                  <div className={ color }
                       style={{height:"4px",
                               width: 100 * item.viewAmount + "%" }}></div>
              </li>
          </Link>
  }

  renderList(){
    let list = [];
    for (const item of this.props.items) {
      list.push(this.render_item(item));
    }
    return list;
  }

  renderButton(props){
    // TODO pass callback to operate actions on selected list items.
    return  <button className="w3-bar-item w3-orange w3-button w3-hover-yellow"
                    key={ props.action }
                    aria-label={ props.action }
                    onClick={ () => props.do() }>
                        { props.image }
            </button>
  }

  renderButtonList() {
    //this set keeps track of what I've already got.
    const buttons = new Set();
    const list = [];
    for (let ib of this.state.buttons) {
      if (! buttons.has( ib.action ) ) {
        buttons.add(ib.action);
        list.push(this.renderButton({ action: ib.action,
                                      image: ib.image,
                                      do: () => ib.do() }))
      }
    }
    return list;
  }

  handleSelect(item){
    const newSelectedItems = new Set(this.state.selectedItems);
    if (newSelectedItems.has(item)){
      newSelectedItems.delete(item);
      //item.is_selected=false;
      this.setState({ selectedItems: newSelectedItems });
    } else {
      newSelectedItems.add(item);
      //item.is_selected=true;
      this.setState({ selectedItems: newSelectedItems });
    }
  }

  renderStyleForButtons(){
    if (this.state.selectedItems.size > 0) {
      return {width:'20px' }
    }
    else {
      return {display: 'none'}
    }
  }

  render() {
    return (
      <div className="w3-cell-row">
        <ul className={"w3-cell w3-ul w3-border-yellow w3-round-xlarge" +
                       ( this.state.selectedItems.size > 0 ? "s9 m9 l11 w3-rightbar": "" )
                    //   ( this.state.selectedItems.size > 0 ? "w3-rightbar": "" )
                     }  >
          { this.renderList() }
        </ul>
        <div className={( this.state.selectedItems.size > 0 ? "w3-cell w3-cell-top s3 m3 l1 ":
                "" ) +
                " " +
                "w3-bar-block w3-orange w3-round"}
              style={ this.renderStyleForButtons() }>
          { this.renderButtonList() }
        </div>
      </div>
    );
  }
}
