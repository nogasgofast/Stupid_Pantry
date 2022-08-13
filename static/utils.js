import React from 'react';
import { Link, Redirect } from "react-router-dom";

export const CONVERT__ = {
        "pinch": 0.03,
        "pinche": 0.03,
        "teaspoon": 0.25,
        "tbs": 0.5,
        "tbsp": 0.5,
        "tablespoon": 0.5,
        "ounce": 1.0,
        "cup": 8.0,
        "pint": 16.0,
        "pound": 16.0,
        "quart": 128.0,
        "liter": 256.0,
        "gallon": 512.0}


export class Request extends React.Component {
    withAuth() {
        let r1 = new XMLHttpRequest()
        r1.open(this.props.method, this.props.url, true)
        for (const key in this.props.headers){
            if (this.props.headers.hasOwnProperty(key)){
                r1.setRequestHeader(key, this.props.headers[key])}}
        r1.setRequestHeader("Accept", "application/json")
        // console.log(this.getCookie('csrf_access_token'))
        r1.setRequestHeader('X-CSRF-TOKEN', this.getCookie('csrf_access_token'))
        r1.onreadystatechange = () => this.wrapCallBack(r1)
        // console.log(":" + this.props.data + ":")
        r1.send(this.props.data)}

    getCookie(name){
      const allCookies  =  document.cookie;
      const cookieArray = allCookies.split(';');
      for (const key in cookieArray){
        const cookie = cookieArray[key].split('=');
        // console.log(cookie)
        if (cookie.length > 1 && cookie[0] == name){
          return cookie[1];
        } else {
          return '';
        }
      }
    }

    wrapCallBack(xhr){
        /*This function intercepts 401 responses before they get to
         the origional callback.*/
        if (xhr.readyState == 2 && xhr.status == 401) {
            const url = '/v1/auth/refresh'
            let r2 = new XMLHttpRequest()
            r2.open('POST', url, true)
            r2.setRequestHeader("Content-Type", "application/json")
            r2.setRequestHeader("Accept", "application/json")
            r2.setRequestHeader('X-CSRF-TOKEN', this.getCookie('csrf_refresh_token'))
            // console.log(this.getCookie('csrf_access_token'))
            r2.onreadystatechange = () => this.refreshResend(r2)
            r2.send()}
        if (xhr.readyState > 1 && xhr.status != 401) {
            this.props.callBack(xhr)}}

    refreshResend(xhr){
        /* as it's name suggests this function interprets the
        re-auth proceedure to see if it worked. Then it makes
        a 3rd request.
        The third request is just re-attempting the first.*/
        if (xhr.readyState == 2 && xhr.status == 200) {
            console.log(xhr.readyState + " " + xhr.status)
            let r3 = new XMLHttpRequest()
            r3.open(this.props.method, this.props.url, true)
            for (const key in this.props.headers){
                if (this.props.headers.hasOwnProperty(key)){
                    r3.setRequestHeader(key, this.props.headers[key])}}
            r3.onreadystatechange = () => this.props.callBack(r3)
            console.log("data: " + this.props.data)
            r3.send(this.props.data)}
        else if (xhr.readyState == 2 && xhr.status == 401){
            this.props.history.push('/login')}}}

export class W3Color{
  random(){
    const colors = ["red", "pink", "purple", "deep-purple", "indigo",
                    "blue", "light-blue", "cyan", "aqua", "teal", "green",
                    "light-green", "lime", "sand", "khaki", "yellow", "amber",
                    "orange", "deep-orange", "blue gray", "brown", "light-gray",
                    "gray", "dark-gray", "pale-red", "pale-yellow", "pale-green",
                    "pale-blue"]
    return "w3-" + colors[Math.floor(Math.random()*colors.length)]}}


export function thumbnail(item) {
  return  (item.imagePath ? (
            <img className="cover"
              src={ item.imagePath }
              height="300px"
              width="100%"  />) :
            "" )
}

export class LinkDispList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      selectedItems: new Set()
    };
  }

    renderItem(item){
        let viewAmount = 0
        let color = 'app-inactive'
        let isActive = false
        if (item.viewAmount > 1){
            viewAmount = 1}
        else {
            viewAmount = item.viewAmount}
        if ( viewAmount > 0 ){
           color = 'w3-green'
           isActive = true
        }
        if ( viewAmount <= 0.5 ){
            color = 'w3-yellow'}
        if ( viewAmount <= 0.25){
            color = 'w3-red'}
        if (item.hasContent) {
          return <Link key={ item.name }
                       to={item.path + encodeURIComponent(item.name)} >
              { thumbnail(item) }
              <li className={"w3-card w3-left-align " +
                  (item.isLoading ?
                      "w3-animate-fading "
                  :
                      "" ) +
                  (this.state.selectedItems.has(item.name) ?
                      " w3-rightbar"
                  :
                      "")}>
                  { item.name  }
                  <div className={ color }
                      style={{height: (isActive ? "4px" : "6px"),
                      width: 100 * item.viewAmount + "%" }}
                      aria-label={item.viewDescription}></div></li></Link>
          }else{
            return <div key="blank" >
                <li className={"w3-card w3-left-align " +
                    (item.isLoading ? "w3-animate-fading " : "" )}>
                    <div className="w3-opacity w3-round-large"
                         style={{height: "20px", width: "100%"}}
                         aria-label="No Items" />
                    </li></div>}
          }

  renderList(){
    let list = [];
    for (const item of this.props.items) {
      list.push(this.renderItem(item));
    }
    return list;
  }

  render() {
    return (
      <ul className="w3-ul w3-border-yellow w3-round-xlarge">
        { this.renderList() }
      </ul>
    );
  }
}
