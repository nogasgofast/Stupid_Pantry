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
        <Header inner="Add Recipe" isLoggedIn={this.props.isLoggedIn} />
        <div className="w3-margin w3-row-padding">
          <div className={"w3-center " +
                          "w3-content " +
                          "w3-mobile "} >
            <div className="w3-white w3-left-align w3-card">
            <h1>Recipe Definition</h1>
            <h3>title</h3>
            Any text can be here, it's ignored<br />
            Any text can be here, it's ignored<br />
            Any text can be here, it's ignored<br />
            <h3>ingredients</h3>
            ingredient specification<br />
            ingredient specification<br />
            Any line with space here is ignored<br />
            ingredient specification<br />
            ingredient specification<br />
            Any line with space here is ignored<br />
            <br />
            <h3>directions</h3>
            step 1<br />
            step 2<br />
            step 3<br />
            <br />
            <h2>Explination</h2>
            <p>The following rules dictate how the recipie is added. This program
            reads each line in turn starting from the top going to the bottom.</p><br />
            <p>
            1. The top most line is always the title of the recipe.<br />
            2. Until the word "ingredients" is read all text and space is ignored.<br />
            3. The line with the ingredients word on it is ignored.<br />
            4. Untill one of "make it" or "instructions" or "directions" is found on a line.
            And ignoreing empty spaces. Each line is processeed as an ingredient.<br />
            5. Skip the line with one of "make it" or "instructions" or "directions" on it.<br />
            6. Untill end of text each line is read as a step in the instructions, ignoring empty
            lines.</p><br />
            <h3>Ingredient specification </h3>
            <p> This program can only accept ingredients written in specific forms. </p>
            Those can be described as having the following gereral formats:<br />
            <p><b>number, spaces, a word.</b></p>
            1 potato<br />
            1        eggs<br />
            4000 carrots<br />
            <p><b>number, spaces, a word, spaces, description</b></p>
            1 grain salt<br />
            20 oz bannanas<br />
            3 huge chickens<br />
            1 cup slightly roasted pork<br />
            <p><b>description, spaces, number, spaces, a word</b></p>
            tomato sauce 3 cans<br />
            yellow golden fancy flour 3 cups<br />
            munster cheese 3 wedges<br />
            bannanas 3 fingers
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
