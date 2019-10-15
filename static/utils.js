import React from 'react';
import { Redirect } from "react-router-dom";

export class Request extends React.Component {
  withAuth() {
    let r1 = new XMLHttpRequest();
    r1.open(this.props.method, this.props.url, true);
    r1.setRequestHeader("Content-Type", "application/json");
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
      console.log("Bearer " + this.props.refreshToken);
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
      r3.setRequestHeader("Content-Type", "application/json");
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
