import React from 'react';
import { Link, Redirect } from "react-router-dom";
import { Header } from './header.js';
import { W3Color, Request, GroupActionList } from './utils.js';

const color = new W3Color;

class Plan extends GroupActionList {

  render_item(item){
    return <Link key={ item } to={ this.state.path + '/' + item } >
              <li className={"w3-list-item w3-left-align"}
                  style={{height: "6em"}} >
                  { item }
                  <div className="w3-gray"
                       style={{height:"4px",
                               width: "100%" }}></div>
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
}

export class MealPlanList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      dates: [],
      mealplans: [],
      is_loading: false
    }
    this.myIsMounted = false;
  }

  componentDidMount() {
    this.myIsMounted = true;
    this.renderRecipes();
  }

  componentWillUnmount() {
    this.myIsMounted = false;
  }

  renderRecipes(){
    let callBack = (xhr) => {
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        //console.log(json)
        if(this.myIsMounted) {
          this.setState({
            dates: json.dates,
            mealplans: json.mealplans,
            is_loading: false
          });
        }
      } else if (xhr.readyState == 4){
        this.setState({ is_loading: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/views/mealplans',
      data: '{}',
      method: 'GET',
      callBack: callBack,
      ...this.props
    };
    this.setState({is_loading: true});
    let req = new Request(settings);
    req.withAuth();
  }

  renderPlan(date){
    //console.log(this.state.mealplans);
    let list  = [];
    for (let plan of this.state.mealplans) {
      //console.log(plan.id);
      if (date == plan.date){
        list.push(<li key={ plan.id } className="" >
                   { plan.recipe }
                  </li>);
      }
    }
    if ( list.length > 0 ){
      return list;
    }else{
      return <div style={{height: "5em"}} />
    }
  }

  renderPlans(){
    let plans = [];
    for (const p of this.state.dates) {
      plans.push(<Link key={ p } to={ "/mealplans/edit/" + p }>
                   <div className="w3-card w3-border-bottom w3-border-yellow w3-container" >
                     { p }
                     <div className="w3-ul">
                     { this.renderPlan(p) }
                     </div>
                   </div>
                 </Link>)
    }
    return plans;
  }

  render() {
    return(
      <>
        <Header history={ this.props.history }
                inner="Mealplans" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className="w3-content">
            { this.renderPlans() }
          </div>
        </div>
      </>
    )
  }
}
//<Plan path="/mealplans" items={ this.state.dates } plans={ this.state.mealplans } />
