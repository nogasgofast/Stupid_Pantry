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

    recipes(){
        return(<>
            <Link to="/recipes"
                  className="w3-btn w3-margin-bottom">
            <h2>Recipes</h2></Link>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.recipes}/>
            <br /></>)}

    todaysMeals(){
        return(<>
            <Link to="/mealplans"
                  className="w3-btn w3-margin-bottom">
            <h3>Todays Meals</h3></Link>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.todayMeals}/>
            <br /></>)}

    readyMeals(){
        return(<>
            <Link to="/search/recipes/Ready"
                  className="w3-btn w3-margin-bottom">
            <h2>Ready Meals</h2></Link>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.readyMeals}/>
            <br /></>)}

    stretchMeals(){
        return(<><Link to="/search/recipes/Ready"
              className="w3-btn w3-margin-bottom">
            <h2>Thrifty Recipes</h2></Link>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.thriftyMeals}/>
            <br /></>)}

    somethingDifferent(){
        return(<>
            <Link to="/search/recipes/Public"
                  className="w3-btn w3-margin-bottom">
            <h2>Featured Recipes</h2></Link>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.featuredMeals}/>
            <br /></>)}

    expiring(){
        return(<>
            <Link to="/search/pantry/Check Soon"
                  className="w3-btn w3-margin-bottom">
            <h3>Expiring Items</h3></Link>
            <Feature isLoading={this.state.isLoading}
                     isError={this.state.isError}
                     items={this.state.ingToCheck}/>
            <br /></>)}

    render() {return( <>
        <Header history={ this.props.history } inner="Home" />
        <div className="w3-container w3-margin-top">
            <div className="w3-content">
                <Link to="/recipes/add">
                  <button className="call-to-action w3-round w3-button w3-block w3-card" >Add Recipe</button>
                </Link>
            </div>
            <div className="w3-row-padding w3-margin-top">
                {this.wrapper(() => this.recipes())}
                {this.wrapper(() => this.stretchMeals())}

            </div>
            <div className="w3-row-padding">
                {this.wrapper(() => this.readyMeals())}
                {this.wrapper(() => this.expiring())}
            </div>
            <div className="w3-row-padding">
                {this.wrapper(() => this.todaysMeals())}
                {this.wrapper(() => this.somethingDifferent())}
            </div></div></>);}}
