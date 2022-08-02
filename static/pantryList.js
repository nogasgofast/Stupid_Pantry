import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';
import { Request, LinkDispList } from './utils.js';


export class PantryList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      recipes: [],
      isLoading: false
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
            isLoading: false
          });
        }
      } else if (xhr.readyState == 4){
        this.setState({ isLoading: false })
        console.log( "Short Status " + xhr.status);
      }
    };

    const settings = {
      url: '/v1/views/pantry',
      data: '{}',
      method: 'GET',
      callBack: callBack,
      history: this.props.history
    };
    this.setState({isLoading: true});
    let req = new Request(settings);
    req.withAuth();
  }

  render() {
    return(
      <>
        <Header history={ this.props.history } inner="Pantry" />
          <div className="w3-margin w3-row-padding">
            <div className="w3-content">
              <Link to="/pantry/add">
                <button className="call-to-action w3-button w3-block w3-card" >New Ingredient</button>
              </Link>
              <LinkDispList path={ '/pantry' } items={ this.state.recipes } />
            </div>
          </div>
      </>
    )
  }
}
