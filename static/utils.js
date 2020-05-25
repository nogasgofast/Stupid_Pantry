import React from 'react';
import { Link, Redirect } from "react-router-dom";

export class Request extends React.Component {
    withAuth() {
        let r1 = new XMLHttpRequest()
        r1.open(this.props.method, this.props.url, true)
        for (const key in this.props.headers){
            if (this.props.headers.hasOwnProperty(key)){
                r1.setRequestHeader(key, this.props.headers[key])}}
        r1.setRequestHeader("Accept", "application/json")
        r1.onreadystatechange = () => this.wrapCallBack(r1)
        //console.log(":" + this.props.data + ":")
        r1.send(this.props.data)}

    wrapCallBack(xhr){
        /*This function intercepts 401 responses before they get to
         the origional callback.*/
        if (xhr.readyState == 2 && xhr.status == 401) {
            const url = '/v1/auth/refresh'
            let r2 = new XMLHttpRequest()
            r2.open('POST', url, true)
            r2.setRequestHeader("Content-Type", "application/json")
            r2.setRequestHeader("Accept", "application/json")
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
        let color = 'w3-green'
        if (item.viewAmount > 1){
            viewAmount = 1}
        else {
            viewAmount = item.viewAmount}
        if ( viewAmount <= 0.5 ){
            color = 'w3-yellow'}
        if ( viewAmount <= 0.25){
            color = 'w3-red'}
        return <Link key={ item.name } to={
            item.hasContent ? item.path + item.name : "" } >
            { thumbnail(item) }
            <li className={"w3-card w3-left-align " +
                (item.isLoading ?
                    "w3-animate-fading "
                :
                    "" ) +
                (this.state.selectedItems.has(item.name) ?
                    "w3-border-yellow w3-rightbar"
                :
                    "")}>
                { item.hasContent ?  item.name : (
                    <div className="w3-orange w3-opacity w3-round-large"
                         style={{height: "20px", width: "100%"}} />) }
                <div className={ color }
                    style={{height:"4px",
                    width: 100 * item.viewAmount + "%" }}></div></li></Link>}

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
