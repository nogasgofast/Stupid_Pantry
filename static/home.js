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

export class Home extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
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

    todaysMeals(){
        return(<>
            <h3>Todays Meals</h3>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.todayMeals}/>
            <br />
            <Link to="/mealplans"
                  className="w3-btn w3-orange w3-margin-bottom">
                Meal Planner</Link></>)}

    readyMeals(){
        return(<>
            <h3>Ready Meals</h3>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.readyMeals}/>
            <br />
            <Link to="/search/recipes/Ready"
                  className="w3-btn w3-orange w3-margin-bottom">
                View More...</Link></>)}

    stretchMeals(){
        return(<>
            <h3>Thrifty Recipes</h3>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.thriftyMeals}/>
            <br />
            <Link to="/search/recipes/Ready"
                  className="w3-btn w3-orange w3-margin-bottom">
                View More...</Link></>)}

    somethingDifferent(){
        return(<>
            <h3>Featured Recipes</h3>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.featuredMeals}/>
            <br />
            <Link to="/search/recipes/Public"
                  className="w3-btn w3-orange w3-margin-bottom">
                View More...</Link></>)}

    recentChanges(){
        return(<>
            <h3>Expiring Items</h3>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.ingToCheck}/>
            <br />
            <Link to="/search/pantry/Check Soon"
                  className="w3-btn w3-orange w3-margin-bottom">
                View More...</Link></>)}

    render() {return( <>
        <Header history={ this.props.history } inner="Home" />
        <div className="w3-container w3-margin-top">
            <div className="w3-content">
                <Link to="/recipes/add">
                  <button className="w3-indigo w3-hover-yellow w3-round w3-btn w3-block w3-card" >Add Recipe</button>
                </Link>
            </div>
            <div className="w3-row-padding w3-margin-top">
                {this.wrapper(() => this.todaysMeals())}
                {this.wrapper(() => this.readyMeals())}
            </div>
            <div className="w3-row-padding">
                {this.wrapper(() => this.stretchMeals())}
                {this.wrapper(() => this.somethingDifferent())}
            </div>
            <div className="w3-row-padding">
                {this.wrapper(() => this.recentChanges())}
            </div></div></>);}}
