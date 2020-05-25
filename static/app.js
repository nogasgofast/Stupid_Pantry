import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from "react-router-dom"
//all includes for each page alphabetical
import { Home } from './home.js'
import { IngredientForm } from './ingredientForm.js'
import { LoginForm } from './login.js'
import { RecoverForm } from './recover.js'
import { LogoutForm } from './logout.js'
import { MealPlanForm } from './mealPlanForm.js'
import { MealPlanList } from './mealPlanList.js'
import { PantryList } from './pantryList.js'
import { ResetForm } from './pwreset.js'
import { EmailValidate } from './emailVerify.js'
import { RecipeDisplay } from './recipeDisplay.js'
import { RecipeForm } from './recipeForm.js'
import { RecipesHelp } from './recipesHelp.js'
import { RecipesList } from './recipesList.js'
import { RegisterForm } from './register.js'
import { SearchList } from './search.js'
import { ShoppingList } from './shoppingList.js'


class App extends React.Component {
    render() {return (
        <div className="">
            <Switch>
                <Route exact
                        path="/register"
                        render={(props)=><RegisterForm {...props} />} />
                <Route exact
                        path="/login"
                        render={(props)=><LoginForm {...props}  />} />
                <Route exact
                        path="/recover"
                        render={(props)=><RecoverForm {...props}  />} />
                <Route exact
                        path="/logout"
                        render={(props)=><LogoutForm {...props} />} />
                <Route exact
                        path="/"
                        render={(props)=><Home {...props} /> } />
                <Route exact
                        path="/pantry"
                        render={(props)=><PantryList {...props} />} />
                <Route
                        path="/search"
                        render={(props)=><SearchList {...props} /> } />
                <Route
                        path="/pantry/"
                        render={(props)=><IngredientForm isEdit {...props} /> } />
                <Route
                        path="/public/recipes/"
                        render={(props)=><RecipeForm {...props} /> } />
                <Route exact
                        path="/verify"
                        render={(props)=><EmailValidate {...props} /> } />
                <Route
                        path="/verify/"
                        render={(props)=><EmailValidate isVerify {...props} /> } />
                <Route exact
                        path="/pwreset"
                        render={(props)=><ResetForm {...props} /> } />
                <Route
                        path="/pwreset/"
                        render={(props)=><ResetForm isReset {...props} /> } />
                <Route exact
                        path="/verify"
                        render={(props)=><ResetForm {...props} /> } />
                <Route
                        path="/shopping"
                        render={(props)=><ShoppingList {...props} /> } />
                <Route exact
                        path="/recipes"
                        render={(props)=><RecipesList {...props} /> } />
                <Route exact
                        path="/mealplans"
                        render={(props)=><MealPlanList {...props} /> } />
                <Route
                        path="/mealplans/edit"
                        render={(props)=><MealPlanForm isEdit {...props} />} />
                <Route exact
                        path="/recipes/add"
                        render={(props)=><RecipeForm {...props} /> } />
                <Route exact
                        path="/recipes/help"
                        render={(props)=><RecipesHelp {...props} /> } />
                <Route
                        path="/recipes/view/"
                        render={(props)=><RecipeDisplay {...props} /> } />
                <Route
                        path="/recipes/edit/"
                        render={(props)=><RecipeForm isEdit {...props} /> }/>
                <Route
                        path="/home"
                        render={(props)=><Home {...props} /> } />
            </Switch></div>)}}

// (<Redirect to="/login" />)

// ========================================
ReactDOM.render((
  <BrowserRouter >
    <App />
  </BrowserRouter>
  ),
  document.getElementById('root')
);
