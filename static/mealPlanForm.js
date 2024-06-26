import React from 'react';
import { Link, withRouter } from "react-router-dom";
import { Header } from './header.js';
import { Request, LinkDispList } from './utils.js';


class RecipeList extends LinkDispList {
  renderDays(item){
    let ret = []
    let days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    for (let day=0; day <= 6; day ++) {
      let todayIsTheDay = false;
      if ( day == item.step && item.stepType == 'dow'){
        todayIsTheDay = true;
      }
      ret.push(<span key={ day } className={"w3-bar-item w3-button w3-hover-yellow " +
                                (todayIsTheDay ? 'w3-yellow' : '')}
                     onClick={() => this.props.updateRepeat(item, day , 'dow') }>
               { days[day] }</span>);
      //console.log(ret);
    }
    //console.log(ret);
    return ret;
  }

  renderItem(item){
    return  <li key={item.id} className={"w3-card w3-left-align " +
                (this.state.selectedItems.has(item.id) ?
                "w3-border-yellow w3-rightbar" :
                "")}>
                { item.recipe }<i className="w3-right w3-btn fas fa-trash"
                                  onClick={() => this.props.removeChoice(item.id)}></i>
                <br />
                Repeat on:
                <div className="w3-bar">
                  { this.renderDays(item) }
                </div>
            </li>}
}

export class MealPlanForm extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isLoading: '',
      isDeleting: '',
      date: '',
      optionList: [],
      choiceList: [],
      search: '',
      recipe: false
    };
    this.myIsMounted= false;
    // These are just handlers being registered with the running process.
    this.removeChoice = this.removeChoice.bind(this);
    this.addChoice = this.addChoice.bind(this);
    this.filter = this.filter.bind(this);
  }

  componentDidMount() {
    this.myIsMounted = true;
    this.renderForm()
  }

  componentWillUnmount() {
    this.myIsMounted = false;
  }

  renderForm(){
    let callBack1 = (xhr) => {
        //console.log(xhr.responseText);
      if ((xhr.readyState == 4) && xhr.status == 200) {
        const {pathname} = this.props.location;
        const date = pathname.replace('/mealplans/edit/', '');
        const mealplans = JSON.parse(xhr.responseText)['mealplans'];
        let choices = [];
        for (let plan of mealplans){
          if (plan['date'] == date ) {
            choices.push(plan);
          }
        }
        if(this.myIsMounted) {
          this.setState({
            date: date,
            choiceList: choices
          });
        }
      } else if (xhr.readyState == 4){
        console.log( "Short Status " + xhr.status);
      }
    };
    let callBack2 = (xhr) => {
        //console.log(xhr.responseText);
      if ((xhr.readyState == 4) && xhr.status == 200) {
        const list = JSON.parse(xhr.responseText)['list'];
        if(this.myIsMounted) {
          this.setState({ optionList: list });
        }
      } else if (xhr.readyState == 4){
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings1 = {
      url: '/v1/views/mealplans',
      data: '{}',
      method: 'GET',
      callBack: callBack1,
      history: this.props.history
    };
    const settings2 = {
      url: '/v1/views/recipes',
      data: '{}',
      method: 'GET',
      callBack: callBack2,
      history: this.props.history
    };
    this.setState({isLoading: true});
    let req1 = new Request(settings1);
    req1.withAuth();
    let req2 = new Request(settings2);
    req2.withAuth();
  }

  removeChoice(id){
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        let newList = [];
        for (let plan of this.state.choiceList){
          if (plan.id != id){
            newList.push(plan);
          }
        }
        if (this.myIsMounted) {
          this.setState({ choiceList: newList,
                          isDeleting: '' });
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ isDeleting: ''});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/mealplans/' + id,
      data: '{}',
      method: 'DELETE',
      callBack: callBack,
      history: this.props.history,
      headers: {"content-type": "application/json"},
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({isDeleting: id});
    };
  }

  renderChoices(){
    let options = [];
    //console.log(this.state.choiceList);
    for (let plan of this.state.choiceList){
      options.push(<li key={ plan.id }
                       value={ plan.recipe }
                       onClick={ () => this.props.removeChoice(plan.id) }>
                    { plan.recipe }<i className="w3-right fas fa-minus"></i>
                  </li>);
    }
    return options;
  }

  addChoice(recipe){
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 201) {
        if (this.myIsMounted) {
          let plan = { id: JSON.parse(xhr.responseText)['id'],
                       recipe: recipe.name,
                       date: this.state.date,
                       step: 0};
          const newList = this.state.choiceList;
          newList.push(plan);
          this.setState({ choiceList: newList,
                          IsLoading: false });
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        this.setState({ IsLoading: ''});
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/mealplans',
      data: JSON.stringify({ "recipe": recipe.name,
                              "date": this.state.date,
                              "step": 0}),
      method: 'POST',
      callBack: callBack,
      history: this.props.history,
      headers: {"content-type": "application/json"}
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
    if (this.myIsMounted) {
      this.setState({IsLoading: recipe});
    };
  }

  renderOptions(){
    let options = [];
    for (let recipe of this.state.optionList){
      let searchlc = this.state.search.toLowerCase();
      let recipeName = recipe.name.toLowerCase();
      if (recipeName.includes(searchlc) || this.state.search == ''){
        options.push(<li key={ recipe.name }
                         value={ recipe.name }
                         onClick={ () => this.addChoice(recipe) }>
                      { recipe.name }<i className="w3-right fas fa-plus"></i>
                    </li>);
      }
    }
    return options;
  }

  updateRepeat(item, step, stepType){
    //feature toggle Repeat off on duplicate entry
    if (item.step == step && item.stepType == stepType){
      step = 0;
      stepType = '';
    }
    let callBack = (xhr) => {
      //console.log(xhr.responseText);
      let state = xhr.readyState;
      let status = xhr.status;
      let cat = Math.floor(status/100);
      if ((state == 4) && status == 200) {
        if (this.myIsMounted) {
          const newList = this.state.choiceList;
          newList.map((it)=>{
            if (it.id == item.id) {
              it.step = step,
              it.stepType = stepType
            };
          });
          //console.log(newList);
          this.setState({ choiceList: newList});
        }
      } else if (state == 4 && cat != 2 && cat != 3) {
        console.log( xhr.responseText );
      }};
    const settings = {
      url: '/v1/mealplans/' + item.id,
      data: JSON.stringify({ "stepType": stepType,
                             "step": step}),
      method: 'PUT',
      callBack: callBack,
      history: this.props.history,
      headers: {"content-type": "application/json"}
    };
    let req = new Request();
    req.props = settings;
    req.withAuth();
  }

  filter(event){
    this.setState({ search: event.target.value});
  }

  //{ this.renderChoices() }


  //recipe list in here use to have this passed to it:
  //{ ...this.props }
  render() {
    return(
      <>
        <Header history={ this.props.history } inner="edit mealplan" />
        <div className="w3-margin w3-row-padding">
          <div className="w3-content">
          <div className={"w3-card w3-form w3-container"} >
            <h4 className="w3-left" >{ this.state.date }</h4>
          </div>
          <div className={"w3-margin-top"} >
            <div className="w3-ul">
              <RecipeList
                    items={ this.state.choiceList }
                    removeChoice={(id) => this.removeChoice(id)}
                    updateRepeat={(item,step,
                                   stepType) => this.updateRepeat(item,step,
                                                                   stepType)}/>
            </div>
          </div>
          <div className={"w3-card w3-margin-top w3-form w3-container"} >
            <div className="w3-bar">
              <label>Filter<i className="w3-bar-item w3-right fas fa-search" /></label>
              <input  className="call-to-action w3-input w3-border-bottom w3-bar-item w3-round"
                      type="search"
                      value={ this.state.search }
                      onChange={ (event) => this.filter(event) } />
            </div>
            <div className="w3-ul" >
              { this.renderOptions() }
            </div>
          </div>
          </div>
        </div>
      </>
    )
  }
}
