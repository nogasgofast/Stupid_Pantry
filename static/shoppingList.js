import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { Request, GroupActionList } from './utils.js';


export class ShoppingList extends React.Component {
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
        //console.log(json)
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
      url: '/v1/views/shopping',
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
        <Header history={ this.props.history }
                inner="Shopping" isLoggedIn={this.props.isLoggedIn} />
          <div className="w3-margin w3-row-padding">
            <div className="w3-content">
              <Link to="/pantry/add">
                <button className="w3-orange w3-hover-yellow w3-btn w3-block w3-card" >New Ingredient</button>
              </Link>
              <GroupActionList path='/pantry'  items={ this.state.recipes } />
            </div>
          </div>
      </>
    )
  }
}
