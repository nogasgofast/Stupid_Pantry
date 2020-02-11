import React from 'react';
import { Link } from "react-router-dom";
import { Header } from './header.js';


export class RecipesHelp extends React.Component {
  constructor(props){
    super(props);
  }

  render() {
    return(
      <>
        <Header history={ this.props.history }
                inner="Add Recipe" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-content "} >
            <div className="w3-white w3-left-align w3-card">
            <h1>Recipe Definition</h1>
            <h3>title</h3>
            Any text can be here, it's ignored<br />
            Any text can be here, it's ignored<br />
            Any text can be here, it's ignored<br />
            <h3>ingredients</h3>
            ingredient<br />
            ingredient<br />
            <br />
            ingredient<br />
            ingredient<br />
            <br />
            <br />
            <h3>directions</h3>
            step 1<br />
            step 2<br />
            step 3<br />
            <br />
            <h2>Explination</h2>
            <p>
            1. The top most line is always the title of the recipe.<br />
            2. The next section starts with the word "ingredients"<br />
            3. This section has one ingredient per line.
            4. The next section starts with one of "make it" or "instructions" or "directions" on it.<br />
            5. This section can have any plain text in it, it's broken up per line</p><br />

            <h3> Numbers </h3>
            <p> Numbers must be of the following forms to be recognized</p>
            1 2/3<br />
            1/2<br />
            1<br />
            1.2<br />
            <p> Lastly when parentheses are seen something special happens </p>
            Tomato Juice 1 cup (2 cans)
            <p> The part with the parentheses is stripped out. One day I may
            start using this information. But as of right now it's ignored.
            so the following is invalid: </p>
            Tomato Juice (2 cans)<br />

            </div>
          </div>
        </div>
      </>
    )
  }
}
