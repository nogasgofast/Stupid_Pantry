import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from "react-router-dom"

//all includes for each page alphabetical
import { EmailValidate } from './emailVerify.js'
import { Home } from './home.js'
import { LoginForm } from './login.js'
import { LogoutForm } from './logout.js'
import { MealPlanForm } from './mealPlanForm.js'
import { MealPlanList } from './mealPlanList.js'
import { PantryForm } from './pantryForm.js'
import { PantryList } from './pantryList.js'
import { RecipeDisplay } from './recipeDisplay.js'
import { RecipeForm } from './recipeForm.js'
import { RecipesHelp } from './recipesHelp.js'
import { RecipesList } from './recipesList.js'
import { RecoverForm } from './recover.js'
import { RegisterForm } from './register.js'
import { ResetForm } from './pwreset.js'
import { SearchList } from './search.js'
import { ShoppingList } from './shoppingList.js'


class App extends React.Component {
    render() {return (
        <div className="">
            <Switch>
                <Route exact
                        path="/"
                        render={(props)=><Home {...props} /> } />
                <Route
                        path="/home"
                        render={(props)=><Home {...props} /> } />
                <Route exact
                        path="/login"
                        render={(props)=><LoginForm {...props}  />} />
                <Route exact
                        path="/logout"
                        render={(props)=><LogoutForm {...props} />} />
                <Route exact
                        path="/mealplans"
                        render={(props)=><MealPlanList {...props} /> } />
                <Route
                        path="/mealplans/edit"
                        render={(props)=><MealPlanForm isEdit {...props} />} />
                <Route exact
                        path="/pantry"
                        render={(props)=><PantryList {...props} />} />
                <Route
                        path="/pantry/add"
                        render={(props)=><PantryForm {...props} /> } />
                <Route
                        path="/pantry/edit/"
                        render={(props)=><PantryForm isEdit {...props} /> } />
                <Route
                        path="/public/recipes/"
                        render={(props)=><RecipeForm {...props} /> } />
                <Route exact
                        path="/pwreset"
                        render={(props)=><ResetForm {...props} /> } />
                <Route
                        path="/pwreset/"
                        render={(props)=><ResetForm isReset {...props} /> } />
                <Route exact
                        path="/recover"
                        render={(props)=><RecoverForm {...props}  />} />
                <Route exact
                        path="/recipes"
                        render={(props)=><RecipesList {...props} /> } />
                <Route exact
                        path="/recipes/add"
                        render={(props)=><RecipeForm isAdd {...props} /> } />
                <Route
                        path="/recipes/edit/"
                        render={(props)=><RecipeForm isEdit {...props} /> }/>
                <Route exact
                        path="/recipes/help"
                        render={(props)=><RecipesHelp {...props} /> } />
                <Route
                        path="/recipes/view/"
                        render={(props)=><RecipeDisplay {...props} /> } />
                <Route exact
                        path="/register"
                        render={(props)=><RegisterForm {...props} />} />
                <Route
                        path="/search"
                        render={(props)=><SearchList {...props} /> } />
                <Route
                        path="/shopping"
                        render={(props)=><ShoppingList {...props} /> } />

                <Route exact
                        path="/verify"
                        render={(props)=><EmailValidate {...props} /> } />
                <Route
                        path="/verify/"
                        render={(props)=><EmailValidate isVerify {...props} /> } />
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
