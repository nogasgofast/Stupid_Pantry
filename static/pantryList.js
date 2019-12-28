import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { Request, GroupActionList } from './utils.js';


class Pantry extends GroupActionList {
  constructor(props) {
    super(props);
    this.state = {
      buttons: new Set(),
      selectedItems: new Set() };
    }

    render_item(item){
      return <Link key={ item.name } to={'/recipes/' + item.name } >
               <li className={"w3-card w3-left-align " +
                 (this.state.selectedItems.has(item.name) ?
                 "w3-border-yellow w3-rightbar" :
                 "")}>
                  { item.name+" "+
                    item.viewAmount+" "+
                    (item.amount_measure ? item.amount_measure : '') }
              </li>
            </Link>
    }
}

export class PantryList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      recipes: [],
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
        //console.log(xhr.responseText);
        if ((xhr.readyState == 4) && xhr.status == 200) {
        const json = JSON.parse(xhr.responseText);
        if(this.myIsMounted) {
          this.setState({
            recipes: json.list,
            is_loading: false
          });
        }
      } else if (xhr.readyState == 4){
        this.setState({ is_loading: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/views/pantry',
      data: '{}',
      method: 'GET',
      callBack: callBack,
      ...this.props
    };
    this.setState({is_loading: true});
    let req = new Request(settings);
    req.withAuth();
  }

  render() {
    return(
      <>
        <Header inner="Pantry" isLoggedIn={this.props.isLoggedIn} />
          <div className="w3-container w3-padding">
            <Link to="/pantry/add">
              <button className="w3-orange w3-hover-yellow w3-btn w3-block w3-card" >New Ingredient</button>
            </Link>
            <Pantry  items={ this.state.recipes } />
          </div>
      </>
    )
  }
}
