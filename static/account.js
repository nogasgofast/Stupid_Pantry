import React from 'react'
import { Header } from './header.js'
import { Link } from "react-router-dom"
import { Request, LinkDispList } from './utils.js';


class Feature extends LinkDispList {
    // override render list to ensure items are populated.
    renderList(){
        let list = []
        let hasContent = false

        for (const item of this.props.items){
            //tell this function how to proceed
            hasContent = true
            //tell anything rendering this item to display the name
            item['hasContent'] = true
            list.push(this.renderItem(item))}

        if (!hasContent && this.props.isLoading) {
            list.push(this.renderItem({name: "one", isLoading: true, viewAmount: 0}))}
        else if (!hasContent && !this.props.isLoading) {
            list.push(this.renderItem({name: "one", isEmpty: true, viewAmount: 0}))}
        return list}
}

export class Account extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            recipes: [],
            todayMeals: [],
            readyMeals: [],
            thriftyMeals: [],
            featuredMeals: [],
            ingToCheck: [],
            isLoading: false,
            isError: false,
            data: ''}
        this.myIsMounted= false}

    componentDidMount() {
        this.myIsMounted = true
        this.getRequest()}

    componentWillUnmount () {
        this.myIsMounted = false}

    getRequest(){
        let callBack = (xhr) => {
            //console.log(xhr.responseText);
            if ((xhr.readyState == 4) && xhr.status == 200) {
                const json = JSON.parse(xhr.responseText);
                if(this.myIsMounted) {
                    this.setState({
                        recipes: json.recipes,
                        todayMeals: json.todayMeals,
                        readyMeals: json.readyMeals,
                        thriftyMeals: json.thriftyMeals,
                        featuredMeals: json.featuredMeals,
                        ingToCheck: json.ingToCheck,
                        isLoading: false})}
            } else if (xhr.readyState == 4 && xhr.status != 401){
                alert(xhr.responseText)
                this.setState({isLoading: false,
                               isError: true })}}
        const settings = {
            url: "/v1/views/home",
            data: '{}',
            method: 'GET',
            callBack: callBack,
            history: this.props.history}
        this.setState({isLoading: true})
        //console.log(settings)
        let req = new Request(settings)
        req.withAuth()}

    wrapper(funcCall){
        return (
            <div className="w3-half w3-margin-bottom">
                <div className="w3-card w3-container">
                    { funcCall() }</div></div>)}

    welcome(){
        return(<>
            <h2>Account Page?!?!?!?!</h2>
            <p>
              This place is under construction<br />
            </p>
            </>)}

    commingSoon(){
        return(<>
              <h2>Comming Soon:</h2>
              <ol>
                <li> A general suggestion box</li>
                <li> Page specific suggestion box</li>
                <li> An way to join anothers team (so you both see the same things when using the app)</li>
                <li> A way to manage team members.</li>
                <li> A way to delete your account when your done.</li>
              </ol></>)}

    changeLog(){
        return(<>
            <h2>Change Log</h2>
            <ol>
              <li>Added a way to rename ingredients</li>
              <li>Added new alert to let people know changing an ingredient changes it's name in recipies</li>
              <li>Added this about us page. (it's a work in progress like everything else)</li>
              <li>Added a Account page to manage teams and account deletion</li>
              <li>Fixed a problem with smart ingredient helper not<br />
                  displaying context sensitive values for things in the pantry<br />
                  for example recipie states 1/2 cup milk but milk in the pantry is stored<br />
                  in ounces. It would say it had 16 cups instead of 4 cups. <br />
                  confusing ounces for cups the silly thing.</li>
              <li>Fixed the way some buttons on login and related pages were bunched up.</li>
              <li>Various un-noticable things. Like cleaning and organizing code</li>
            </ol></>)}

    render() {return( <>
        <Header history={ this.props.history } inner="Home" />
        <div className="w3-container w3-margin-top">
            <div className="w3-content">
                { this.wrapper(() => this.welcome()) }
                { this.wrapper(() => this.commingSoon()) }
                { this.wrapper(() => this.changeLog()) }
            </div>
          </div>
          </>);}}
